import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
SPEC = importlib.util.spec_from_file_location("build_site", SCRIPTS / "build_site.py")
build_site = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(build_site)
ASSETS = Path(__file__).parents[1] / "web"


def paragraph(ident, number, offset, text):
    words = len(text.split())
    return {"id": ident, "paragraph": number, "source_p_ordinal": number + 1, "source_element_id": None,
            "word_start": offset, "word_count": words, "page_start": offset // 250 + 1,
            "page_end": (offset + words - 1) // 250 + 1, "text": text}


def citation(ident, text):
    return {"id": ident, "book": 1, "chapter": 1, "paragraph": int(ident[-4:]), "page_start": 1, "page_end": 1,
            "word_count": len(text.split()), "label": f"label for {ident}", "source_member": "1/ch.html",
            "source_element_tag": "p", "source_element_ordinal": 2, "source_text_slot": "text"}


def fixture():
    corpus = {"source_sha256": "fixture", "books": [{
        "number": 1, "title": "Harry Potter and the Fixture Stone", "chapters": [{
            "number": 1, "title": "Arrival", "is_epilogue": False, "source_member": "1/ch.html",
            "paragraphs": [paragraph("B01-C001-P0001", 1, 0, "The cited hall."),
                           paragraph("B01-C001-P0002", 2, 3, "Never cited anywhere."),
                           paragraph("B01-C001-P0003", 3, 6, "A cited lawn.")]}]}]}
    def record(ident, ref, text):
        return {"id": ident, "location": "A place", "category": "interior", "certainty": "explicit",
                "temporal": "arrival", "description": "Paraphrase.", "model_notes": "Note.",
                "evidence": [ref], "places": ["hall"], "areas": ["castle"], "citations": [citation(ref, text)]}
    catalogue = {"source_sha256": "fixture", "pagination": {"scheme": "ref250-v1"}, "entries": [
        record("B01-002", "B01-C001-P0001", "The cited hall."),
        record("B01-001", "B01-C001-P0003", "A cited lawn.")]}
    areas = {"areas": [{"id": "castle", "title": "Castle"}]}
    places = {"places": [{"id": "hall", "title": "Hall", "area": "castle", "kind": "place", "scope": "Room."}]}
    return corpus, catalogue, areas, places


def inventory_of(corpus):
    return {"source_sha256": corpus["source_sha256"], "books": [
        {"number": book["number"], "title": book["title"], "chapters": [
            {"number": ch["number"], "title": ch["title"], "is_epilogue": ch["is_epilogue"],
             "paragraph_count": len(ch["paragraphs"])} for ch in book["chapters"]]}
        for book in corpus["books"]]}


def local_site():
    corpus, catalogue, areas, places = fixture()
    return build_site.site_data(inventory_of(corpus), catalogue, areas, places, build_site.cited_passages(corpus, catalogue))


def public_site():
    corpus, catalogue, areas, places = fixture()
    return build_site.site_data(inventory_of(corpus), catalogue, areas, places)


class SiteDataTests(unittest.TestCase):
    def test_only_cited_paragraphs_are_shipped(self):
        data = local_site()
        self.assertEqual(data["passages"], {"B01-C001-P0001": "The cited hall.", "B01-C001-P0003": "A cited lawn."})
        self.assertEqual(data["meta"]["quotedWords"], 6)

    def test_public_edition_holds_no_book_text(self):
        data = public_site()
        self.assertEqual(data["passages"], {})
        self.assertEqual(data["meta"]["quotedWords"], 0)
        payload = json.dumps(data)
        for text in ("The cited hall.", "Never cited anywhere.", "A cited lawn."):
            self.assertNotIn(text, payload)

    def test_public_edition_differs_only_in_the_text(self):
        local, public = local_site(), public_site()
        for edition in (local, public):
            del edition["passages"]
            del edition["meta"]["quotedWords"]
        self.assertEqual(local, public)

    def test_catalogue_order_is_preserved_for_the_chronological_view(self):
        data = local_site()
        self.assertEqual([entry["id"] for entry in data["entries"]], ["B01-002", "B01-001"])

    def test_entry_carries_citation_locators_and_navigation(self):
        entry = local_site()["entries"][0]
        self.assertEqual(entry["places"], ["hall"])
        self.assertEqual(entry["notes"], "Note.")
        ref = entry["citations"][0]
        self.assertEqual((ref["paragraph"], ref["pageStart"], ref["element"]), (1, 1, "p[2]"))
        self.assertEqual(ref["member"], "1/ch.html")

    def test_book_titles_are_shortened_for_navigation(self):
        book = local_site()["books"][0]
        self.assertEqual(book["shortTitle"], "Fixture Stone")
        self.assertEqual(book["chapters"][0]["title"], "Arrival")

    def test_mismatched_sources_are_refused(self):
        corpus, catalogue, areas, places = fixture()
        catalogue["source_sha256"] = "other"
        with self.assertRaises(ValueError):
            build_site.cited_passages(corpus, catalogue)
        with self.assertRaises(ValueError):
            build_site.site_data(inventory_of(corpus), catalogue, areas, places)

    def test_written_site_loads_from_disk_without_a_server(self):
        data = local_site()
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "site"
            build_site.write_site(data, ASSETS, output)
            page = (output / "index.html").read_text()
            for asset in ("style.css", "data.js", "app.js"):
                self.assertIn(asset, page)
                self.assertTrue((output / asset).exists())
            self.assertNotIn("http://", page)
            self.assertNotIn("https://", page)
            self.assertNotIn('type="module"', page)
            script = (output / "data.js").read_text()
            prefix = "window.HOGWARTS_DATA="
            self.assertTrue(script.startswith(prefix))
            self.assertEqual(json.loads(script[len(prefix):].rstrip().rstrip(";")), data)


if __name__ == "__main__":
    unittest.main()
