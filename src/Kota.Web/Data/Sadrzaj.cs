namespace Kota.Web.Data;

public record Projekat(
    string Slug, string Naziv, string Vrsta, string Grad, int Godina, int Povrsina, string Status,
    string Slika, string Opis, string Uvod, string Tekst, string[] Odluke, string Narucilac, string Pozicija = "50% 50%");

public record Brojka(int Vrijednost, string Sufiks, string Naziv);
public record Korak(string Broj, string Naslov, string Tekst);
public record Clan(string Ime, string Uloga, string Inicijali);
public record Prostor(string Slika, string Naslov, string Opis, string Alt);
public record Izvor(string Datoteka, string Naslov, string Autor, string Adresa);
public record Dio(string Tekst, bool Istaknuto = false);

public static class Sadrzaj
{
    public const string Naziv = "Kota";
    public const string Telefon = "+387 33 555 010";
    public const string TelefonLink = "+38733555010";
    public const string Eposta = "studio@kota-arhitekti.example";
    public const string Adresa = "Mejtaš 14, 71000 Sarajevo";
    public const int OsnovanoGodine = 2009;
    public const int BrojPorodica = 120;

    public static readonly string[] Usluge =
    [
        "Arhitektura", "Enterijer", "Urbanizam", "Rekonstrukcija", "Nadzor gradnje", "Energetska efikasnost",
    ];

    // Image (alt text) = Opis; Uvod = one sentence under the title; Tekst = the story of the project.
    public static readonly IReadOnlyList<Projekat> Projekti =
    [
        new("vila-vrelo", "Vila Vrelo", "Porodična kuća", "Trebinje", 2024, 480, "Useljeno",
            "vrelo.jpg", "Niska vila s dugim krovom i staklenim ogradama među suhom travom",
            "Niska kuća koja leži u pejzažu kao da je oduvijek tu.",
            "Parcela je tiha, blago nagnuta i puna suhe trave, pa nismo željeli kuću koja se nameće. Vila je rastegnuta uz teren, s dugim ravnim krovom koji pravi hlad i staklenim ogradama kroz koje pogled ide do kraja doline. Unutra se prelazi iz prostora u prostor bez praga, a drvo na fasadi vremenom dobija boju okolne trave.",
            ["Dug krov štiti od ljetnog sunca, a zimi pušta nisko sunce duboko u kuću.", "Fasada je od lokalnog drveta koje se ne farba, pa kuća s godinama samo postaje ljepša.", "Terasa i dnevni boravak su na istoj koti, bez stepenika, pa se život prelijeva napolje."],
            "Privatni investitor", "50% 55%"),
        new("kuca-avlija", "Kuća Avlija", "Porodična kuća", "Mostar", 2023, 310, "Useljeno",
            "avlija.jpg", "Zid boje pijeska i unutrašnje dvorište s krupnim listom biljke",
            "Zidovi boje pijeska oko dvorišta u koje se okreću sve sobe.",
            "Stari mostarski običaj je da se kuća okrene prema sebi, a ne prema ulici. Zato je ova kuća zatvorena prema vani, a sve sobe gledaju u avliju s drvetom i biljkama. Debeli zidovi premazani bojom pijeska drže hladnoću ljeti i toplinu zimi, a ulaz je uvučen tako da se do njega dolazi laganim, pomalo tajnim prolazom.",
            ["Sve sobe imaju prozor prema avliji, pa je privatnost potpuna bez zavjesa.", "Zidovi su debljine 45 cm i premazani prirodnom žbukom koja se lako popravlja.", "Biljke u dvorištu zasađene su tako da prirodno hlade južni zid."],
            "Porodica iz Mostara", "50% 50%"),
        new("bijela-kuca", "Bijela kuća", "Porodična kuća", "Sarajevo", 2022, 420, "Idejno rješenje",
            "bijela.jpg", "Bijela kuća s velikim staklenim stranama i bazenom u dvorištu (3D prikaz)",
            "Dvije bijele kutije i stakleni pojas koji ih spaja.",
            "Naručioci su tražili kuću koja je jednako dobra za porodični ručak i za dvadeset gostiju. Odgovor su dva bijela volumena spojena staklenim prizemljem, tako da se dnevni boravak otvara u cijelosti prema bazenu i bašti. Na spratu su spavaće sobe, mirne i okrenute drveću. Projekat je prikazan 3D prikazom jer još nije izgrađen.",
            ["Stakleno prizemlje se uvlači u zidove, pa se boravak spaja s baštom.", "Bijele plohe odbijaju sunce i smanjuju troškove hlađenja.", "Bazen je smješten uz dnevni boravak, a ne na kraju bašte, da bi bio dio kuće."],
            "Privatni investitor", "50% 50%"),
        new("kula-zavoj", "Kula Zavoj", "Stambena zgrada", "Tuzla", 2022, 8900, "Useljeno",
            "zavoj.jpg", "Zaobljena stambena kula snimljena odozdo prema nebu",
            "Stambena kula čije se etaže blago zavijaju oko središnjeg atrijuma.",
            "Stambena kula sa 64 stana okružena je saobraćajem sa tri strane, pa je jedini mirni pogled bio prema unutra. Zato su stanovi poredani oko visokog atrijuma s dnevnim svjetlom, a vanjska fasada se zaobljava i smanjuje buku. Zavoj daje svakom stanu malo drugačiji pogled, tako da nijedna dva nisu ista.",
            ["Središnji atrijum donosi dnevno svjetlo u hodnike i uklanja potrebu za vještačkim osvjetljenjem preko dana.", "Zaobljena fasada smanjuje buku saobraćaja za oko 6 decibela.", "Svaki stan ima prolaznu ventilaciju, od vanjske fasade do atrijuma."],
            "Stambena zadruga Tuzla", "50% 50%"),
        new("dom-krivina", "Dom kulture Krivina", "Javna zgrada", "Zenica", 2021, 2600, "Otvoreno",
            "krivina.jpg", "Zaobljeni balkon i drveni plafon u unutrašnjosti doma kulture",
            "Zaobljeni balkoni i drveni plafon koji skupljaju svjetlo.",
            "Dom kulture je zamišljen kao jedan veliki hol u kojem se ljudi susreću prije predstave. Balkoni se zaobljavaju prema holu i hvataju dnevno svjetlo, a drveni plafon od uskih letvi upija zvuk, pa se u holu može razgovarati bez vike. Večernji koncerti se dijelom prelijevaju u hol.",
            ["Drvene letve na plafonu upijaju zvuk i daju holu toplu boju.", "Zaobljeni balkoni su istovremeno galerije za posmatranje i mjesto susreta.", "Dvorana i hol mogu se otvoriti jedno prema drugom za veće događaje."],
            "Grad Zenica", "50% 50%"),
        new("paviljon-suma", "Paviljon Šuma", "Javni paviljon", "Banja Luka", 2025, 640, "U izgradnji",
            "suma.jpg", "Isprepletene drvene lamele koje se talasaju poput krošnji",
            "Isprepletene drvene lamele koje podsjećaju na krošnje.",
            "Paviljon u gradskom parku treba da bude mjesto za odmor i manje događaje, a ne još jedna zgrada. Zato smo ga sagradili od drvenih lamela koje se isprepliću i talasaju, pa svjetlo kroz njih pada kao kroz krošnje. Lamele su od jedne vrste drveta, a spojevi se vide, pa se konstrukcija čita sama.",
            ["Lamele filtriraju svjetlo i prave dnevni hlad bez zidova.", "Cijeli paviljon je od jedne vrste drveta, pa se lako održava i popravlja.", "Završetak gradnje planiran je za proljeće 2027."],
            "Grad Banja Luka", "50% 50%"),
    ];

    public static readonly IReadOnlyList<Prostor> Prostori =
    [
        new("nisa.jpg", "Soba za čitanje", "Tiho mjesto gdje znanje i dizajn žive u skladu.", "Fotelja ispred zaobljene niše u svijetlom zidu"),
        new("boravak.jpg", "Dnevni boravak", "Projektovan da bude mjesto na kojem se osjećate kao kod kuće.", "Svijetla sofa u prostoru s mekim dnevnim svjetlom"),
        new("salon.jpg", "Zajednički salon", "Dnevno svjetlo s dvije strane i prostor za dvadeset gostiju.", "Svijetli salon s velikim prozorima i toplim tonovima"),
    ];

    public static readonly IReadOnlyList<Brojka> Brojke =
    [
        new(DateTime.Now.Year - OsnovanoGodine, "+", "godina iskustva"),
        new(84, "", "realizovana projekta"),
        new(12, "", "gradova u BiH"),
        new(100, "%", "autorski nacrti"),
    ];

    public static readonly IReadOnlyList<Korak> Pristup =
    [
        new("01", "Slušamo", "Prije prve linije provedemo dan na parceli i sat vremena s ljudima koji će u zgradi živjeti ili raditi. Najbolje ideje obično kažu oni, a ne mi."),
        new("02", "Mjerimo", "Sunce, vjetar, buka, tlo, propisi i budžet. Zapišemo sve što ograničava, jer ograničenja su polovina dobrog nacrta."),
        new("03", "Crtamo", "Skice na papiru, pa makete, pa tek onda računar. Klijent vidi i dodirne model prije nego što se išta potroši."),
        new("04", "Gradimo", "Ostajemo na gradilištu do posljednjeg vijka. Nadzor radimo sami, jer se zgrada ne gradi iz kancelarije."),
    ];

    public static readonly IReadOnlyList<Clan> Tim =
    [
        new("Lejla Kovačević", "Osnivačica, glavna arhitektica", "LK"),
        new("Damir Begić", "Voditelj projekata", "DB"),
        new("Sanja Tanović", "Enterijer i detalji", "ST"),
        new("Tarik Mujkić", "Konstrukcija i nadzor", "TM"),
    ];

    public static readonly IReadOnlyList<Izvor> Izvori =
    [
        new("hero.jpg", "Futuristic Architectural Design in Doha's Museum", "Natalya Rostun", "https://www.pexels.com/photo/futuristic-architectural-design-in-doha-s-museum-34793517/"),
        new("vrelo.jpg", "Modern Villa in the Desert", "Studio Pépite", "https://www.pexels.com/photo/modern-villa-in-the-desert-11871257/"),
        new("avlija.jpg", "Modern Desert Villa Exterior with Palm Plant", "Tatilimiz Villada", "https://www.pexels.com/photo/modern-desert-villa-exterior-with-palm-plant-35141528/"),
        new("bijela.jpg", "A 3D Rendering of a Modern House with a Swimming Pool", "Bilal Mansuri", "https://www.pexels.com/photo/a-sleek-modern-house-exterior-with-a-swimming-pool-13203179/"),
        new("zavoj.jpg", "Modern Building Against Sky", "Snapwire", "https://www.pexels.com/photo/modern-building-against-sky-250450/"),
        new("krivina.jpg", "Modern Architectural Interior with Curved Balcony", "David Underland", "https://www.pexels.com/photo/modern-architectural-interior-with-curved-balcony-36689946/"),
        new("suma.jpg", "Bizarre Modern Architecture", "Laura Meinhardt", "https://www.pexels.com/photo/bizarre-modern-architecture-14668169/"),
        new("nisa.jpg", "Minimalistic Interior Design", "Ksenia Chernaya", "https://www.pexels.com/photo/minimalistic-interior-design-6615806/"),
        new("boravak.jpg", "Photograph of a Sofa on a Gray Carpet", "Sarazh Izmailov", "https://www.pexels.com/photo/photograph-of-a-sofa-on-a-gray-carpet-13086783/"),
        new("salon.jpg", "Luxury living room with modern light furniture", "Max Vakhtbovych", "https://www.pexels.com/photo/luxury-living-room-with-modern-light-furniture-6207822/"),
        new("puz.jpg", "Abstract Spiral Staircase from Below View", "Ivan Dražić", "https://www.pexels.com/photo/abstract-spiral-staircase-from-below-view-36050473/"),
        new("studio.jpg", "Modern Architectural Structure with Curves", "iramezatil", "https://www.pexels.com/photo/modern-architectural-structure-with-curves-31432559/"),
    ];

    /// <summary>The statement split into parts; highlighted parts get the sand colour.</summary>
    public static readonly IReadOnlyList<Dio> IzjavaDijelovi =
    [
        new("Svaka kuća koju projektujemo je razgovor između "),
        new("smjele arhitekture", true),
        new(", preciznosti i čovjeka koji se usudi da živi "),
        new("drugačije", true),
        new("."),
    ];

    public static string Izjava => string.Concat(IzjavaDijelovi.Select(d => d.Tekst));

    public const string Citat = "Kota nam je dala zgradu koju ljudi vole prije nego što shvate zašto. I danas neko svaki dan kaže nešto lijepo o svjetlu u hodniku.";
    public const string CitatAutor = "Naručilac, Dom kulture Krivina";

    public static Projekat? Nadji(string slug) => Projekti.FirstOrDefault(p => p.Slug == slug);

    public static Projekat Sljedeci(string slug)
    {
        var i = Projekti.ToList().FindIndex(p => p.Slug == slug);
        return Projekti[(i + 1) % Projekti.Count];
    }

    /// <summary>Number with a dot as the thousands separator ("6.200").</summary>
    public static string Broj(int n) => n.ToString("N0", System.Globalization.CultureInfo.InvariantCulture).Replace(',', '.');
}
