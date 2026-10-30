import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("corpus", Path(__file__).parents[1] / "scripts/corpus.py")
corpus = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(corpus)


class CorpusTests(unittest.TestCase):
    def test_whitespace(self):
        self.assertEqual(corpus.normalise(" A\u00a0 B\nC "), "A B C")

    def test_pages_previews_and_source_ordinals(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "fixture.epub"
            with zipfile.ZipFile(source, "w") as archive:
                archive.writestr("1/OEBPS/content.opf", '''<package xmlns="http://www.idpf.org/2007/opf" xmlns:d="http://purl.org/dc/elements/1.1/"><metadata><d:title>Fixture</d:title><d:identifier>9781781100073</d:identifier></metadata></package>''')
                archive.writestr("1/OEBPS/hp01_ch001_en-gb.html", '<html xmlns="http://www.w3.org/1999/xhtml"><body><p class="pagebreak"> </p><h1>Chapter</h1><p>' + ' '.join(['word'] * 249) + '</p><p>A <i>small</i> room.</p></body></html>')
                archive.writestr("1/OEBPS/hp02_ch001_en-gb.html", '<html><body>preview</body></html>')
            with patch.object(corpus, "EXPECTED", {1: 1}):
                result = corpus.extract(source)
            book = result["books"][0]
            p1, p2 = book["chapters"][0]["paragraphs"]
            self.assertEqual((p1["page_start"], p1["page_end"]), (1, 1))
            self.assertEqual((p2["page_start"], p2["page_end"]), (1, 2))
            self.assertEqual(p2["text"], "A small room.")
            self.assertEqual(p1["source_p_ordinal"], 2)
            self.assertFalse(result["pagination"]["printed_page_map"])
            self.assertEqual(len(result["excluded_preview_members"]), 1)
            self.assertEqual(book["word_count"], 252)
            self.assertEqual(book["reference_pages"], 2)


if __name__ == "__main__":
    unittest.main()
