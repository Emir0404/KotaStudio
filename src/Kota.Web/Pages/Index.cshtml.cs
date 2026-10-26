using Kota.Web.Data;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Kota.Web.Pages;

public class IndexModel : PageModel
{
    /// <summary>The studio's statement; highlighted parts get the sand colour. Built in C# so that no stray space appears around punctuation.</summary>
    public IHtmlContent IzjavaHtml
    {
        get
        {
            var sb = new HtmlContentBuilder();
            foreach (var dio in Sadrzaj.IzjavaDijelovi)
            {
                if (dio.Istaknuto)
                    sb.AppendHtml("<span class=\"isticanje\">").Append(dio.Tekst).AppendHtml("</span>");
                else
                    sb.Append(dio.Tekst);
            }
            return sb;
        }
    }
}
