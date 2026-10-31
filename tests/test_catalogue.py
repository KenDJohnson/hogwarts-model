import importlib.util
from html.parser import HTMLParser
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("catalogue", Path(__file__).parents[1] / "scripts/catalogue.py")
catalogue = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(catalogue)


def fixture():
    paragraphs = []
    offset = 0
    for i, text in enumerate([" ".join(["stone"] * 249), "A small room."], 1):
        words = len(text.split())
        paragraphs.append({"id": f"B01-C001-P{i:04d}", "paragraph": i,
                           "source_p_ordinal": i+1, "source_element_id": None,
                           "word_start": offset, "word_count": words,
                           "page_start": offset//250+1, "page_end": (offset+words-1)//250+1,
                           "text": text})
        offset += words
    corpus = {"source_sha256": "fixture", "pagination": {"scheme": "ref250-v1"}, "books": [
        {"number": 1, "title": "Fixture", "chapters": [
            {"number": 1, "title": "Arrival", "is_epilogue": False,
             "source_member": "1/chapter.html", "paragraphs": paragraphs}]}]}
    record = {"book": 1, "entries": [{
        "id": "B01-001", "location": "A room", "category": "interior",
        "description": "A small room.", "evidence": ["B01-C001-P0002"],
        "certainty": "explicit", "temporal": "arrival", "model_notes": "Size is relative."}],
        "chapter_reviews": [{"chapter": 1, "reviewed_ranges": [[1, 2]],
                             "method": "full-text paragraph review", "notes": "Read all."}]}
    return corpus, record


class ReaderParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.page = None
        self.in_text = False
        self.in_ref = False
        self.words = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "section":
            self.page = attrs["id"]
            self.words[self.page] = []
        if tag == "p" and attrs.get("id", "").startswith("B01-"):
            self.in_text = True
        if tag == "a" and attrs.get("class") == "ref":
            self.in_ref = True

    def handle_endtag(self, tag):
        if tag == "p":
            self.in_text = False
        if tag == "a":
            self.in_ref = False

    def handle_data(self, data):
        if self.in_text and not self.in_ref:
            self.words[self.page].extend(data.split())


class CatalogueTests(unittest.TestCase):
    def test_partial_review_does_not_claim_completion(self):
        corpus, record = fixture()
        record["chapter_reviews"][0]["reviewed_ranges"] = [[1, 1]]
        errors, coverage = catalogue.validate(corpus, [record])
        self.assertEqual(errors, [])
        self.assertFalse(coverage["complete"])
        self.assertEqual(coverage["books"][0]["chapters"][0]["unread_ranges"], [[2, 2]])

    def test_bad_evidence_and_review_range_fail(self):
        corpus, record = fixture()
        record["entries"][0]["evidence"] = ["B01-C001-P9999"]
        record["chapter_reviews"][0]["reviewed_ranges"] = [[1, 3]]
        errors, _ = catalogue.validate(corpus, [record])
        self.assertEqual(len(errors), 2)

    def test_nonparagraph_text_needs_its_own_review(self):
        corpus, record = fixture()
        extra = {**corpus["books"][0]["chapters"][0]["paragraphs"][1],
                 "id": "B01-C001-X0001", "paragraph": None, "source_order": 3, "is_extra": True}
        corpus["books"][0]["chapters"][0]["extra_blocks"] = [extra]
        errors, coverage = catalogue.validate(corpus, [record])
        self.assertEqual(errors, [])
        self.assertFalse(coverage["complete"])
        self.assertEqual(coverage["additional_text_blocks"], 1)
        record["extra_reviews"] = [{"id": extra["id"], "method": "full-text review", "notes": "Read the extra cell."}]
        errors, coverage = catalogue.validate(corpus, [record])
        self.assertEqual(errors, [])
        self.assertTrue(coverage["complete"])
        self.assertIn("extra fragment 1", catalogue.citation({**extra, "book":1, "chapter":1, "chapter_title":"Arrival", "is_epilogue":False}))

    def test_compiled_citation_and_reader_word_boundaries(self):
        corpus, record = fixture()
        errors, coverage = catalogue.validate(corpus, [record])
        self.assertEqual(errors, [])
        self.assertTrue(coverage["complete"])
        compiled = catalogue.compile_catalogue(corpus, [record])
        ref = compiled["entries"][0]["citations"][0]
        self.assertEqual((ref["page_start"], ref["page_end"]), (1, 2))
        self.assertIn("ref p. 1–2", ref["label"])
        with tempfile.TemporaryDirectory() as tmp:
            catalogue.write_reader(corpus, compiled, Path(tmp))
            parser = ReaderParser()
            parser.feed((Path(tmp)/"book-01.html").read_text())
            self.assertEqual(len(parser.words["page-1"]), 250)
            self.assertEqual(parser.words["page-2"], ["small", "room."])


class PlaceTests(unittest.TestCase):
    def setUp(self):
        self.areas = {"areas": [{"id": "castle", "title": "Castle"}, {"id": "grounds", "title": "Grounds"}]}
        self.places = {"places": [
            {"id": "hall", "title": "Hall", "area": "castle", "kind": "place", "scope": "One room."},
            {"id": "lawn", "title": "Lawn", "area": "grounds", "kind": "group", "scope": "Open ground."}],
            "assignments": {"B01-001": ["lawn", "hall"]}}

    def test_complete_assignment_passes(self):
        self.assertEqual(catalogue.validate_places({"B01-001"}, self.places, self.areas), [])

    def test_unplaced_unknown_and_unused_fail(self):
        self.places["assignments"] = {"B01-001": ["hall", "hall"], "B01-002": ["cellar"]}
        errors = catalogue.validate_places({"B01-001", "B01-003"}, self.places, self.areas)
        self.assertEqual(errors, ["B01-003: record has no place",
                                  "B01-002: place assignment for unknown record",
                                  "B01-001: needs one to four distinct places",
                                  "B01-002: unknown place cellar",
                                  "lawn: place has no records"])

    def test_bad_place_definition_fails(self):
        self.places["places"][0].update(area="tower", kind="room")
        errors = catalogue.validate_places({"B01-001"}, self.places, self.areas)
        self.assertEqual(errors, ["hall: unknown area tower", "hall: unknown place kind room"])

    def test_areas_follow_places_in_order(self):
        compiled = {"entries": [{"id": "B01-001"}]}
        catalogue.assign_places(compiled, self.places)
        self.assertEqual(compiled["entries"][0]["places"], ["lawn", "hall"])
        self.assertEqual(compiled["entries"][0]["areas"], ["grounds", "castle"])

    def test_area_pages_list_a_record_in_each_of_its_areas(self):
        corpus, record = fixture()
        compiled = catalogue.compile_catalogue(corpus, [record])
        catalogue.assign_places(compiled, self.places)
        with tempfile.TemporaryDirectory() as tmp:
            catalogue.write_area_pages(compiled, self.areas, self.places, Path(tmp))
            for area in ("castle", "grounds"):
                page = (Path(tmp) / f"{area}.md").read_text()
                self.assertIn("## B01-001: A room", page)
                self.assertIn("Places: Lawn, Hall.", page)
            self.assertIn("[Castle](castle.md): 1 records.", (Path(tmp) / "index.md").read_text())


if __name__ == "__main__":
    unittest.main()
