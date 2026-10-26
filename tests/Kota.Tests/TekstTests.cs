using System.Text.RegularExpressions;
using Kota.Web.Data;

namespace Kota.Tests;

/// <summary>All the page's text must be Bosnian and free of invented claims that would look like real advertising.</summary>
public class TekstTests
{
    private static IEnumerable<string> SviTekstovi()
    {
        foreach (var p in Sadrzaj.Projekti)
        {
            yield return p.Naziv; yield return p.Uvod; yield return p.Tekst; yield return p.Narucilac; yield return p.Vrsta;
            foreach (var o in p.Odluke) yield return o;
        }
        foreach (var k in Sadrzaj.Pristup) { yield return k.Naslov; yield return k.Tekst; }
        foreach (var c in Sadrzaj.Tim) yield return c.Uloga;
        foreach (var p in Sadrzaj.Prostori) { yield return p.Naslov; yield return p.Opis; yield return p.Alt; }
        yield return Sadrzaj.Izjava; yield return Sadrzaj.Citat; yield return Sadrzaj.CitatAutor;
    }

    // Words that are not Bosnian (Croatian or Serbian variants) or that would change the meaning.
    [Theory]
    [InlineData("kruh")]
    [InlineData("tisuć")]
    [InlineData("točno")]
    [InlineData("kafa")]
    [InlineData("rezerv")]
    [InlineData("mlijeko")]
    [InlineData("uopće")]
    public void Tekst_NemaRijecikojeNisuBosanske(string rijec)
    {
        foreach (var t in SviTekstovi())
            Assert.DoesNotMatch($"(?<!\\p{{L}}){rijec}", t.ToLowerInvariant());
    }

    [Fact]
    public void Tekst_ObracanjeJeSaVi()
    {
        // "ti" forms must not appear in the text (the studio addresses visitors with "vi", the formal "you").
        foreach (var t in SviTekstovi())
            Assert.DoesNotMatch(@"(?<!\p{L})(tvoj|tebe|tebi|imaš|možeš|dođi)(?!\p{L})", t.ToLowerInvariant());
    }

    [Fact]
    public void Tekst_BezDvostrukihRazmakaIPraznihRecenica()
    {
        foreach (var t in SviTekstovi())
        {
            Assert.DoesNotContain("  ", t);
            Assert.Equal(t.Trim(), t);
            Assert.DoesNotContain("..", t.Replace("...", ""));
        }
    }

    [Fact]
    public void Tekst_Sadrzi_BosanskaSlova()
    {
        var sve = string.Join(' ', SviTekstovi());
        foreach (var znak in "čćšžđ")
            Assert.Contains(znak, sve);
        Assert.Matches(new Regex("[ije]"), sve);
    }
}
