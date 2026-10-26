using System.Text.Encodings.Web;
using System.Text.Unicode;
using Kota.Web.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();

// By default Razor writes č, ć, š, ž, đ as &#x10D; etc.; we allow the Latin extensions so the text stays readable in the page source.
builder.Services.AddWebEncoders(o => o.TextEncoderSettings = new TextEncoderSettings(
    UnicodeRanges.BasicLatin, UnicodeRanges.Latin1Supplement, UnicodeRanges.LatinExtendedA, UnicodeRanges.GeneralPunctuation));

builder.Services.AddResponseCompression(o => o.EnableForHttps = true);

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
}

app.UseResponseCompression();

app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    await next();
});

app.UseStatusCodePagesWithReExecute("/404");

app.UseStaticFiles(new StaticFileOptions
{
    // CSS and JS carry a ?v= fingerprint (asp-append-version); images and fonts rarely change.
    OnPrepareResponse = ctx => ctx.Context.Response.Headers.CacheControl = "public,max-age=604800",
});

app.MapRazorPages();

app.MapGet("/robots.txt", (HttpRequest r) =>
    Results.Text($"User-agent: *\nAllow: /\nSitemap: {r.Scheme}://{r.Host}/sitemap.xml\n", "text/plain"));

app.MapGet("/sitemap.xml", (HttpRequest r) =>
{
    var osnova = $"{r.Scheme}://{r.Host}";
    var adrese = new[] { "/" }.Concat(Sadrzaj.Projekti.Select(p => $"/projekti/{p.Slug}"));
    var xml = string.Concat(adrese.Select(a => $"  <url><loc>{osnova}{a}</loc></url>\n"));
    return Results.Text($"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n{xml}</urlset>", "application/xml");
});

app.Run();

// Lets the tests start the real app (WebApplicationFactory<Program>).
public partial class Program;
