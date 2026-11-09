using Phobos.Domain;
using Phobos.Infrastructure.Seed;

namespace Phobos.Infrastructure.Tests;

public sealed class PhobiaSeedTests
{
    [Fact]
    public void Parse_turns_each_entry_into_a_published_case_file()
    {
        const string json = """
            [
              {
                "slug": "arachnophobia",
                "caseNumber": 1,
                "category": "animals",
                "translations": {
                  "fr": { "name": "Arachnophobie", "etymology": "du grec", "summary": "Peur des araignées.", "description": "Desc.", "annotation": "Note." },
                  "en": { "name": "Arachnophobia", "etymology": "from Greek", "summary": "Fear of spiders.", "description": "Desc (en).", "annotation": "Note (en)." }
                }
              }
            ]
            """;

        var phobia = Assert.Single(PhobiaSeed.Parse(json));

        Assert.Equal(("arachnophobia", 1, Category.Animals, true), (phobia.Slug, phobia.CaseNumber, phobia.Category, phobia.IsPublished));
        Assert.Equal(
            new PhobiaTranslation(Language.En, "Arachnophobia", "from Greek", "Fear of spiders.", "Desc (en).", "Note (en)."),
            phobia.TranslationFor(Language.En));
        Assert.Equal("Arachnophobie", phobia.TranslationFor(Language.Fr).Name);
    }

    [Fact]
    public void Parse_refuses_an_unknown_language_or_category()
    {
        const string unknownLanguage = """
            [{ "slug": "x", "caseNumber": 1, "category": "animals",
               "translations": { "pt": { "name": "n", "etymology": "e", "summary": "s", "description": "d", "annotation": "a" } } }]
            """;
        const string unknownCategory = """
            [{ "slug": "x", "caseNumber": 1, "category": "monsters",
               "translations": { "fr": { "name": "n", "etymology": "e", "summary": "s", "description": "d", "annotation": "a" } } }]
            """;

        Assert.Throws<InvalidDataException>(() => PhobiaSeed.Parse(unknownLanguage));
        Assert.Throws<InvalidDataException>(() => PhobiaSeed.Parse(unknownCategory));
    }

    [Fact]
    public void The_shipped_seed_holds_thirty_complete_case_files()
    {
        var phobias = PhobiaSeed.LoadShipped();

        Assert.Equal(30, phobias.Count);
        Assert.Equal(Enumerable.Range(1, 30), phobias.Select(phobia => phobia.CaseNumber).Order());
        Assert.Equal(30, phobias.Select(phobia => phobia.Slug).Distinct().Count());
        Assert.All(phobias, phobia =>
        {
            Assert.Equal(Languages.All, phobia.Translations.Select(translation => translation.Language).Order());
            Assert.All(phobia.Translations, translation => Assert.All(
                [translation.Name, translation.Etymology, translation.Summary, translation.Description, translation.Annotation],
                text => Assert.False(string.IsNullOrWhiteSpace(text), $"{phobia.Slug}/{translation.Language} has an empty text")));
        });
    }

    [Fact]
    public void The_shipped_seed_covers_the_four_categories()
    {
        var byCategory = PhobiaSeed.LoadShipped().CountBy(phobia => phobia.Category).ToDictionary();

        Assert.Equal(13, byCategory[Category.Animals]);
        Assert.Equal(8, byCategory[Category.NatureAndSpaces]);
        Assert.Equal(5, byCategory[Category.BodyAndHealth]);
        Assert.Equal(4, byCategory[Category.Strange]);
    }
}
