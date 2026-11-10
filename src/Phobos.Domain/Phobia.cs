using System.Text.RegularExpressions;

namespace Phobos.Domain;

/// <summary>A phobia case file: its identity, its texts in each language and its exposure media.</summary>
public sealed partial class Phobia
{
    private readonly List<PhobiaTranslation> _translations = [];
    private readonly List<ExposureMedia> _media = [];

    public string Slug { get; }
    public int CaseNumber { get; }
    public Category Category { get; }
    public bool IsPublished { get; private set; }

    public IReadOnlyList<PhobiaTranslation> Translations => _translations;
    public IReadOnlyList<ExposureMedia> Media => _media;

    private Phobia(string slug, int caseNumber, Category category)
    {
        Slug = slug;
        CaseNumber = caseNumber;
        Category = category;
    }

    public static Phobia Create(string slug, int caseNumber, Category category, IEnumerable<PhobiaTranslation> translations)
    {
        if (!SlugFormat().IsMatch(slug))
            throw new DomainRuleException($"'{slug}' is not a slug: use lowercase words joined by single hyphens.");
        if (caseNumber is < 1 or > 999)
            throw new DomainRuleException($"Case number {caseNumber} is outside 1 to 999.");

        var phobia = new Phobia(slug, caseNumber, category);
        phobia._translations.AddRange(translations);

        if (phobia._translations.Count == 0)
            throw new DomainRuleException("A phobia needs at least one translation.");
        if (phobia._translations.DistinctBy(translation => translation.Language).Count() != phobia._translations.Count)
            throw new DomainRuleException("A phobia has at most one translation per language.");

        return phobia;
    }

    public void Publish() => IsPublished = true;

    /// <summary>The requested language, else the fallback language, else the first translation.</summary>
    public PhobiaTranslation TranslationFor(Language language) =>
        _translations.Find(translation => translation.Language == language)
        ?? _translations.Find(translation => translation.Language == Languages.Fallback)
        ?? _translations[0];

    public void AddMedia(ExposureMedia media) => _media.Add(media);

    public IReadOnlyList<ExposureMedia> MediaForLevel(int level) => _media.FindAll(media => media.Level == level);

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex SlugFormat();
}
