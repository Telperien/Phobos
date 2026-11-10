using Phobos.Domain;
using Phobos.Infrastructure.Content;

namespace Phobos.Infrastructure.Tests;

public sealed class PhobiaContentTests
{
    private const string Texts = """
        "translations": {
          "fr": { "name": "Arachnophobie", "etymology": "du grec", "summary": "Peur des araignées.", "description": "Desc.", "annotation": "Note." },
          "en": { "name": "Arachnophobia", "etymology": "from Greek", "summary": "Fear of spiders.", "description": "Desc (en).", "annotation": "Note (en)." }
        }
        """;

    private static string CaseFile(string slug = "arachnophobia", int caseNumber = 1, string extra = "") => $$"""
        { "slug": "{{slug}}", "caseNumber": {{caseNumber}}, "category": "animals", {{Texts}} {{extra}} }
        """;

    private static ContentFile File(string slug, int caseNumber) => new($"{slug}.json", CaseFile(slug, caseNumber));

    [Fact]
    public void A_case_file_holds_its_texts_and_is_published_by_default()
    {
        var phobia = PhobiaContent.Parse(CaseFile());

        Assert.Equal(("arachnophobia", 1, Category.Animals, true), (phobia.Slug, phobia.CaseNumber, phobia.Category, phobia.IsPublished));
        Assert.Equal(
            new PhobiaTranslation(Language.En, "Arachnophobia", "from Greek", "Fear of spiders.", "Desc (en).", "Note (en)."),
            phobia.TranslationFor(Language.En));
        Assert.Empty(phobia.Media);
    }

    [Fact]
    public void A_draft_stays_unpublished()
    {
        Assert.False(PhobiaContent.Parse(CaseFile(extra: """, "published": false""")).IsPublished);
    }

    [Fact]
    public void A_case_file_lists_its_images_with_their_credits_and_its_video()
    {
        var phobia = PhobiaContent.Parse(CaseFile(extra: """
            , "images": [
                { "level": 1, "file": "arachnophobia/1-a.webp", "origin": "ai" },
                { "level": 2, "file": "arachnophobia/2-a.webp", "origin": "web",
                  "author": "Jean Dupont", "license": "CC BY 4.0", "url": "https://commons.wikimedia.org/wiki/File:Spider.jpg" }
              ],
              "video": { "youtube": "dQw4w9WgXcQ", "start": 30 }
            """));

        Assert.Collection(phobia.Media,
            cute =>
            {
                Assert.Equal((1, MediaKind.Image, "arachnophobia/1-a.webp"), (cute.Level, cute.Kind, cute.Source));
                Assert.Same(ImageCredit.Generated, cute.Credit);
            },
            found =>
            {
                Assert.Equal((2, "arachnophobia/2-a.webp"), (found.Level, found.Source));
                Assert.Equal(
                    ImageCredit.Licensed("CC BY 4.0", new Uri("https://commons.wikimedia.org/wiki/File:Spider.jpg"), "Jean Dupont"),
                    found.Credit);
            },
            video => Assert.Equal((5, MediaKind.YouTube, "dQw4w9WgXcQ", 30), (video.Level, video.Kind, video.Source, video.StartSeconds)));
    }

    [Theory]
    [InlineData("""{ "level": 1, "file": "arachnophobia/1-a.webp", "origin": "found" }""", "origin 'found'")]
    [InlineData("""{ "level": 1, "file": "arachnophobia/1-a.png", "origin": "ai" }""", "'arachnophobia/1-a.png'")]
    [InlineData("""{ "level": 1, "file": "acrophobia/1-a.webp", "origin": "ai" }""", "'acrophobia/1-a.webp'")]
    [InlineData("""{ "level": 1, "file": "arachnophobix/1-a.webp", "origin": "ai" }""", "'arachnophobix/1-a.webp'")]
    [InlineData("""{ "level": 1, "file": "arachnophobiax1-a.webp", "origin": "ai" }""", "'arachnophobiax1-a.webp'")]
    [InlineData("""{ "level": 1, "file": "arachnophobia/../1-a.webp", "origin": "ai" }""", "'arachnophobia/../1-a.webp'")]
    [InlineData("""{ "level": 1, "file": "arachnophobia/1-a.webp", "origin": "web", "license": "CC0" }""", "address it comes from")]
    public void An_image_must_be_a_webp_of_its_own_case_file_with_a_known_origin(string image, string explanation)
    {
        var error = Assert.Throws<InvalidDataException>(() =>
            PhobiaContent.Parse(CaseFile(extra: $$""", "images": [{{image}}]""")));

        Assert.Contains(explanation, error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void An_image_found_on_the_web_without_a_licence_is_refused()
    {
        const string image = """{ "level": 2, "file": "arachnophobia/2-a.webp", "origin": "web", "url": "https://example.org/spider" }""";

        Assert.Throws<DomainRuleException>(() => PhobiaContent.Parse(CaseFile(extra: $$""", "images": [{{image}}]""")));
    }

    [Theory]
    [InlineData("""{ "slug": "x", "caseNumber": 1, "category": "animals", "translations": { "pt": { "name": "n", "etymology": "e", "summary": "s", "description": "d", "annotation": "a" } } }""")]
    [InlineData("""{ "slug": "x", "caseNumber": 1, "category": "monsters", "translations": { "fr": { "name": "n", "etymology": "e", "summary": "s", "description": "d", "annotation": "a" } } }""")]
    [InlineData("null")]
    public void An_unknown_language_or_category_or_an_empty_file_is_refused(string json)
    {
        var error = Assert.Throws<InvalidDataException>(() => PhobiaContent.Parse(json));

        Assert.Matches("language 'pt'|category 'monsters'|empty", error.Message);
    }

    [Theory]
    [InlineData("""{ "slug": "arachnophobia", "caseNumber": 1, "category": "animals" }""")]
    [InlineData("""{ "slug": "arachnophobia", "caseNumber": 1, "category": "animals", "translations": { "fr": { "name": "n", "etymology": "e", "summary": "s", "description": "d", "annotation": null } } }""")]
    public void A_missing_or_empty_required_field_is_refused(string json)
    {
        var error = Assert.Throws<InvalidDataException>(() =>
            PhobiaContent.Load([new ContentFile("arachnophobia.json", json)]));

        Assert.StartsWith("arachnophobia.json: ", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Each_file_is_named_after_its_case_file()
    {
        var error = Assert.Throws<InvalidDataException>(() =>
            PhobiaContent.Load([new ContentFile("spiders.json", CaseFile())]));

        Assert.Contains("spiders.json", error.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("{ broken")]
    [InlineData("""{ "slug": "arachnophobia", "caseNumber": 1, "category": "animals", "translations": {}, "video": { "youtube": "nope", "start": 0 } }""")]
    public void A_faulty_file_is_named_in_the_error(string json)
    {
        var error = Assert.Throws<InvalidDataException>(() =>
            PhobiaContent.Load([new ContentFile("arachnophobia.json", json)]));

        Assert.StartsWith("arachnophobia.json: ", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Two_case_files_cannot_share_a_case_number()
    {
        var error = Assert.Throws<InvalidDataException>(() =>
            PhobiaContent.Load([File("arachnophobia", 1), File("acrophobia", 1)]));

        Assert.Contains("acrophobia", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Case_files_are_loaded_in_case_number_order()
    {
        var phobias = PhobiaContent.Load([File("acrophobia", 14), File("arachnophobia", 1)]);

        Assert.Equal(["arachnophobia", "acrophobia"], phobias.Select(phobia => phobia.Slug));
    }

    [Fact]
    public void The_shipped_content_holds_thirty_complete_case_files()
    {
        var phobias = PhobiaContent.LoadShipped();

        Assert.Equal(Enumerable.Range(1, 30), phobias.Select(phobia => phobia.CaseNumber));
        Assert.All(phobias, phobia =>
        {
            Assert.Equal(Languages.All, phobia.Translations.Select(translation => translation.Language).Order());
            Assert.All(phobia.Translations, translation => Assert.All(
                [translation.Name, translation.Etymology, translation.Summary, translation.Description, translation.Annotation],
                text => Assert.False(string.IsNullOrWhiteSpace(text), $"{phobia.Slug}/{translation.Language} has an empty text")));
        });
    }

    [Fact]
    public void The_shipped_content_covers_the_four_categories()
    {
        var byCategory = PhobiaContent.LoadShipped().CountBy(phobia => phobia.Category).ToDictionary();

        Assert.Equal(13, byCategory[Category.Animals]);
        Assert.Equal(8, byCategory[Category.NatureAndSpaces]);
        Assert.Equal(5, byCategory[Category.BodyAndHealth]);
        Assert.Equal(4, byCategory[Category.Strange]);
    }
}
