using System.Net;
using System.Text.RegularExpressions;
using Kota.Web.Data;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Kota.Tests;

/// <summary>Starts the real app in memory and checks the pages as a browser sees them.</summary>
public class WebTests(WebApplicationFactory<Program> fabrika) : IClassFixture<WebApplicationFactory<Program>>
{
    private async Task<string> Sirovo(string adresa = "/") => await fabrika.CreateClient().GetStringAsync(adresa);
    private async Task<string> Dekodirano(string adresa = "/") => WebUtility.HtmlDecode(await Sirovo(adresa));

    [Fact]
    public async Task Pocetna_VracaHtmlSaSvimSekcijama()
    {
        var r = await fabrika.CreateClient().GetAsync("/");
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        Assert.StartsWith("text/html", r.Content.Headers.ContentType!.MediaType);
        var html = await r.Content.ReadAsStringAsync();
        foreach (var id in new[] { "vrh", "onama", "projekti", "pristup", "studio", "kontakt", "sadrzaj" })
            Assert.Contains($"id=\"{id}\"", html);
        Assert.Contains("<html lang=\"bs\"", html);
    }

    [Fact]
    public async Task Pocetna_PrikazujeSadrzajIzCSharpPodataka()
    {
        var html = await Dekodirano();
        Assert.All(Sadrzaj.Projekti, p =>
        {
            Assert.Contains(p.Naziv, html);
            Assert.Contains($"/projekti/{p.Slug}", html);
        });
        Assert.All(Sadrzaj.Pristup, k => Assert.Contains(k.Naslov, html));
        Assert.All(Sadrzaj.Tim, c => Assert.Contains(c.Ime, html));
        Assert.All(Sadrzaj.Prostori, p => Assert.Contains(p.Naslov, html));
        Assert.Contains(Sadrzaj.Izjava, html.Replace("<span class=\"isticanje\">", "").Replace("</span>", ""));
        Assert.Contains(Sadrzaj.Telefon, html);
        Assert.Contains(Sadrzaj.Eposta, html);
        Assert.Equal(Sadrzaj.Projekti.Count, Regex.Matches(html, "class=\"rad\"").Count);
    }

    [Fact]
    public async Task Pocetna_SlovaCcSZDjSuSlovaINeEntiteti()
    {
        var html = await Sirovo();
        Assert.Contains("tišinu", html);
        Assert.Contains("Mejtaš", html);
        Assert.DoesNotMatch("&#x1[0-7][0-9A-Fa-f];", html);
    }

    [Fact]
    public async Task Pocetna_NemaTrakeSUslugama()
    {
        var html = await Sirovo();
        Assert.DoesNotContain("class=\"traka", html);
    }

    [Fact]
    public async Task Pocetna_NemaObrazacaIRezervacija()
    {
        var html = (await Dekodirano()).ToLowerInvariant();
        Assert.DoesNotContain("<form", html);
        Assert.DoesNotContain("rezerv", html);
    }

    [Fact]
    public async Task Pocetna_ImaDemoNapomenuIAutoreFotografija()
    {
        var html = await Dekodirano();
        Assert.Contains("Demo stranica", html);
        Assert.All(Sadrzaj.Izvori, i => Assert.Contains(i.Autor, html));
    }

    [Fact]
    public async Task Pocetna_SveSlikeImajuAltIDimenzije()
    {
        var html = await Sirovo();
        foreach (Match m in Regex.Matches(html, "<img [^>]*>"))
        {
            Assert.Contains("alt=\"", m.Value);
            Assert.Contains("width=\"", m.Value);
            Assert.Contains("height=\"", m.Value);
        }
    }

    [Theory]
    [InlineData("vila-vrelo")]
    [InlineData("kuca-avlija")]
    [InlineData("bijela-kuca")]
    [InlineData("kula-zavoj")]
    [InlineData("dom-krivina")]
    [InlineData("paviljon-suma")]
    public async Task StranicaProjekta_PrikazujePodatkeProjekta(string slug)
    {
        var p = Sadrzaj.Nadji(slug)!;
        var r = await fabrika.CreateClient().GetAsync($"/projekti/{slug}");
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var html = WebUtility.HtmlDecode(await r.Content.ReadAsStringAsync());
        Assert.Contains($"<title>{p.Naziv}, {p.Grad} – Kota</title>", html);
        Assert.Contains(p.Tekst, html);
        Assert.All(p.Odluke, o => Assert.Contains(o, html));
        Assert.Contains($"{Sadrzaj.Broj(p.Povrsina)} m²", html);
        Assert.Contains($"view-transition-name:p-{slug}", html);
        Assert.Contains($"/projekti/{Sadrzaj.Sljedeci(slug).Slug}", html);
    }

    [Fact]
    public async Task Prelaz_ImeNaKarticiIStraniciProjektaJeIsto()
    {
        var pocetna = await Sirovo();
        foreach (var p in Sadrzaj.Projekti)
        {
            Assert.Contains($"view-transition-name:p-{p.Slug}", pocetna);
            Assert.Contains($"view-transition-name:p-{p.Slug}", await Sirovo($"/projekti/{p.Slug}"));
        }
    }

    [Fact]
    public async Task NepoznatProjekat_Vraca404SNasomStranicom()
    {
        var r = await fabrika.CreateClient().GetAsync("/projekti/nema-ga");
        Assert.Equal(HttpStatusCode.NotFound, r.StatusCode);
        Assert.Contains("Ovdje još", WebUtility.HtmlDecode(await r.Content.ReadAsStringAsync()));
    }

    [Fact]
    public async Task NepoznataAdresa_Vraca404()
    {
        var r = await fabrika.CreateClient().GetAsync("/nema");
        Assert.Equal(HttpStatusCode.NotFound, r.StatusCode);
    }

    [Fact]
    public async Task RobotsISitemap_Rade()
    {
        var robots = await Sirovo("/robots.txt");
        Assert.Contains("Sitemap:", robots);
        var mapa = await Sirovo("/sitemap.xml");
        Assert.All(Sadrzaj.Projekti, p => Assert.Contains($"/projekti/{p.Slug}</loc>", mapa));
    }

    [Fact]
    public async Task Odgovor_ImaSigurnosnaZaglavlja()
    {
        var r = await fabrika.CreateClient().GetAsync("/");
        Assert.Equal("nosniff", r.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", r.Headers.GetValues("X-Frame-Options").Single());
        Assert.True(r.Headers.Contains("Referrer-Policy"));
    }

    [Fact]
    public async Task StatickiFajlovi_SeDajuSKesiranjem()
    {
        foreach (var f in new[] { "/img/hero.jpg", "/fonts/inter-latin-wght-normal.woff2", "/favicon.svg" })
        {
            var r = await fabrika.CreateClient().GetAsync(f);
            Assert.Equal(HttpStatusCode.OK, r.StatusCode);
            Assert.Contains("max-age", r.Headers.CacheControl?.ToString());
        }
    }

    [Fact]
    public async Task Css_IJs_ImajuOtisakVerzije()
    {
        var html = await Sirovo();
        Assert.Matches(@"/css/site\.css\?v=", html);
        Assert.Matches(@"/js/site\.js\?v=", html);
    }
}
