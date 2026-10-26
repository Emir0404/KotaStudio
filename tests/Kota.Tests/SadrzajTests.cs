using Kota.Web.Data;

namespace Kota.Tests;

public class SadrzajTests
{
    private static string Img(string datoteka) =>
        Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "Kota.Web", "wwwroot", "img", datoteka);

    [Fact]
    public void Projekti_ImajuJedinstvenAdresnuOznakuISamoMaleSlovaIMyphene()
    {
        Assert.Equal(Sadrzaj.Projekti.Count, Sadrzaj.Projekti.Select(p => p.Slug).Distinct().Count());
        Assert.All(Sadrzaj.Projekti, p => Assert.Matches("^[a-z]+(-[a-z]+)*$", p.Slug));
    }

    [Fact]
    public void Projekti_ImajuSvaPoljaITriOdluke()
    {
        Assert.Equal(6, Sadrzaj.Projekti.Count);
        foreach (var p in Sadrzaj.Projekti)
        {
            Assert.False(string.IsNullOrWhiteSpace(p.Naziv));
            Assert.False(string.IsNullOrWhiteSpace(p.Uvod));
            Assert.True(p.Tekst.Length > 150, $"{p.Naziv}: priča je prekratka");
            Assert.Equal(3, p.Odluke.Length);
            Assert.InRange(p.Godina, 2015, DateTime.Now.Year + 2);
            Assert.InRange(p.Povrsina, 200, 50_000);
            Assert.False(string.IsNullOrWhiteSpace(p.Opis), $"{p.Naziv}: nema opisa slike (alt)");
        }
    }

    [Fact]
    public void Slike_PostojeNaDiskuISvakaImaZapisanogAutora()
    {
        var korisnene = Sadrzaj.Projekti.Select(p => p.Slika).Concat(Sadrzaj.Prostori.Select(p => p.Slika)).Concat(["hero.jpg", "puz.jpg", "studio.jpg"]).Distinct();
        foreach (var datoteka in korisnene)
        {
            Assert.True(File.Exists(Img(datoteka)), $"Nema slike {datoteka}");
            Assert.Contains(Sadrzaj.Izvori, i => i.Datoteka == datoteka);
        }
        Assert.All(Sadrzaj.Izvori, i =>
        {
            Assert.StartsWith("https://www.pexels.com/photo/", i.Adresa);
            Assert.False(string.IsNullOrWhiteSpace(i.Autor));
            Assert.True(File.Exists(Img(i.Datoteka)), $"Izvor za nepostojeću sliku {i.Datoteka}");
        });
    }

    [Fact]
    public void Izvori_NemajuNepotrebnihSlika()
    {
        var koristene = Sadrzaj.Projekti.Select(p => p.Slika).Concat(Sadrzaj.Prostori.Select(p => p.Slika)).Concat(["hero.jpg", "puz.jpg", "studio.jpg"]).ToHashSet();
        Assert.Equal(koristene.Count, Sadrzaj.Izvori.Count);
        Assert.All(Sadrzaj.Izvori, i => Assert.Contains(i.Datoteka, koristene));
    }

    [Fact]
    public void Slike_NisuPreteske()
    {
        foreach (var i in Sadrzaj.Izvori)
            Assert.True(new FileInfo(Img(i.Datoteka)).Length < 700_000, $"{i.Datoteka} je preteška");
    }

    [Fact]
    public void Sljedeci_KruziKrozSveProjekteBezStajanja()
    {
        var sad = Sadrzaj.Projekti[0].Slug;
        var posjeceni = new HashSet<string>();
        for (var i = 0; i < Sadrzaj.Projekti.Count; i++)
        {
            Assert.True(posjeceni.Add(sad));
            sad = Sadrzaj.Sljedeci(sad).Slug;
        }
        Assert.Equal(Sadrzaj.Projekti[0].Slug, sad);
    }

    [Fact]
    public void Nadji_VracaProjekatIliNull()
    {
        Assert.NotNull(Sadrzaj.Nadji("vila-vrelo"));
        Assert.Null(Sadrzaj.Nadji("nema-ga"));
    }

    [Theory]
    [InlineData(6200, "6.200")]
    [InlineData(950, "950")]
    [InlineData(12000, "12.000")]
    public void Broj_KoristiTackuKaoRazdjelnikHiljada(int n, string ocekivano) => Assert.Equal(ocekivano, Sadrzaj.Broj(n));

    [Fact]
    public void Brojke_GodineRadaSeRacunajuOdOsnivanja()
    {
        Assert.Equal(DateTime.Now.Year - Sadrzaj.OsnovanoGodine, Sadrzaj.Brojke[0].Vrijednost);
        Assert.All(Sadrzaj.Brojke, b => Assert.True(b.Vrijednost > 0));
        Assert.Equal(Sadrzaj.Izjava, string.Concat(Sadrzaj.IzjavaDijelovi.Select(d => d.Tekst)));
        Assert.Equal(2, Sadrzaj.IzjavaDijelovi.Count(d => d.Istaknuto));
    }

    [Fact]
    public void Pristup_Ima4KorakaPoRedu()
    {
        Assert.Equal(["01", "02", "03", "04"], Sadrzaj.Pristup.Select(k => k.Broj));
    }

    [Fact]
    public void Tim_InicijaliOdgovarajuImenima()
    {
        Assert.All(Sadrzaj.Tim, c =>
        {
            var dijelovi = c.Ime.Split(' ');
            Assert.Equal(string.Concat(dijelovi.Select(d => d[0])), c.Inicijali);
        });
    }

    [Fact]
    public void Kontakt_JeIzmisljen()
    {
        Assert.EndsWith(".example", Sadrzaj.Eposta);
        Assert.StartsWith("+387", Sadrzaj.Telefon);
        Assert.Equal(Sadrzaj.TelefonLink, Sadrzaj.Telefon.Replace(" ", ""));
    }
}
