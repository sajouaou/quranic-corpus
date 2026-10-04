// Converts lemmas from Buckwalter transliteration to Arabic script and to the phonetic
// transcription used by the corpus, with the corpus API's own encoders.
//
// Reads one lemma per line and writes: lemma, Arabic, phonetic (tab separated).
//
// Usage: java -cp <quranic-corpus-api jar> scripts/LemmaText.java < lemmas.txt
import static app.qurancorpus.arabic.encoding.buckwalter.BuckwalterDecoder.fromBuckwalter;
import static app.qurancorpus.arabic.encoding.phonetic.PhoneticEncoder.toPhonetic;
import static app.qurancorpus.arabic.encoding.unicode.UnicodeEncoder.toUnicode;

import app.qurancorpus.arabic.encoding.phonetic.PhoneticContext;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

public class LemmaText {
    public static void main(String[] args) throws Exception {
        var reader = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
        var out = new PrintStream(System.out, true, StandardCharsets.UTF_8);
        String line;
        while ((line = reader.readLine()) != null) {
            var text = fromBuckwalter(line);
            out.println(line + "\t" + toUnicode(text) + "\t" + toPhonetic(new PhoneticContext(null, null), text));
        }
    }
}
