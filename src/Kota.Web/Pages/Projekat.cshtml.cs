using Kota.Web.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Kota.Web.Pages;

public class ProjekatModel : PageModel
{
    public Projekat Projekat { get; private set; } = null!;
    public Projekat Sljedeci { get; private set; } = null!;

    public IActionResult OnGet(string slug)
    {
        var p = Sadrzaj.Nadji(slug);
        if (p is null) return NotFound();
        Projekat = p;
        Sljedeci = Sadrzaj.Sljedeci(slug);
        return Page();
    }
}
