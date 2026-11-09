namespace Phobos.Domain.Tests;

public sealed class PhobiaTests
{
    private static PhobiaTranslation Translation(Language language, string name = "Arachnophobie") =>
        new(language, name, "du grec arákhnē", "Peur des araignées.", "Description.", "Annotation.");

    private static Phobia Arachnophobia(params PhobiaTranslation[] translations) =>
        Phobia.Create("arachnophobia", 1, Category.Animals,
            translations.Length > 0 ? translations : [Translation(Language.Fr)]);

    [Fact]
    public void Create_keeps_the_identity_of_the_case_file()
    {
        var phobia = Arachnophobia();

        Assert.NotEqual(Guid.Empty, phobia.Id);
        Assert.Equal("arachnophobia", phobia.Slug);
        Assert.Equal(1, phobia.CaseNumber);
        Assert.Equal(Category.Animals, phobia.Category);
    }

    [Theory]
    [InlineData("")]
    [InlineData("Arachnophobia")]
    [InlineData("arachno phobia")]
    [InlineData("-arachnophobia")]
    [InlineData("arachnophobia-")]
    [InlineData("arachno--phobia")]
    [InlineData("arachnophobie-é")]
    public void Create_rejects_a_slug_that_is_not_lowercase_words_joined_by_hyphens(string slug)
    {
        Assert.Throws<DomainRuleException>(() =>
            Phobia.Create(slug, 1, Category.Animals, [Translation(Language.Fr)]));
    }

    [Fact]
    public void Create_accepts_digits_and_single_hyphens_in_the_slug()
    {
        var phobia = Phobia.Create("fear-2-of-x", 1, Category.Strange, [Translation(Language.Fr)]);

        Assert.Equal("fear-2-of-x", phobia.Slug);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1000)]
    public void Create_rejects_a_case_number_outside_1_to_999(int caseNumber)
    {
        Assert.Throws<DomainRuleException>(() =>
            Phobia.Create("arachnophobia", caseNumber, Category.Animals, [Translation(Language.Fr)]));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(999)]
    public void Create_accepts_case_numbers_at_the_bounds(int caseNumber)
    {
        var phobia = Phobia.Create("arachnophobia", caseNumber, Category.Animals, [Translation(Language.Fr)]);

        Assert.Equal(caseNumber, phobia.CaseNumber);
    }

    [Fact]
    public void Create_requires_at_least_one_translation()
    {
        Assert.Throws<DomainRuleException>(() => Phobia.Create("arachnophobia", 1, Category.Animals, []));
    }

    [Fact]
    public void Create_rejects_two_translations_in_the_same_language()
    {
        Assert.Throws<DomainRuleException>(() =>
            Arachnophobia(Translation(Language.Fr), Translation(Language.Fr, "Autre")));
    }

    [Fact]
    public void A_new_case_file_is_unpublished_until_published()
    {
        var phobia = Arachnophobia();
        Assert.False(phobia.IsPublished);

        phobia.Publish();

        Assert.True(phobia.IsPublished);
    }

    [Fact]
    public void TranslationFor_returns_the_requested_language()
    {
        var phobia = Arachnophobia(Translation(Language.Fr, "Arachnophobie"), Translation(Language.De, "Arachnophobie (de)"));

        Assert.Equal("Arachnophobie (de)", phobia.TranslationFor(Language.De).Name);
    }

    [Fact]
    public void TranslationFor_falls_back_to_english_when_the_language_is_missing()
    {
        var phobia = Arachnophobia(Translation(Language.Fr, "Arachnophobie"), Translation(Language.En, "Arachnophobia"));

        Assert.Equal("Arachnophobia", phobia.TranslationFor(Language.It).Name);
    }

    [Fact]
    public void TranslationFor_falls_back_to_the_first_translation_without_english()
    {
        var phobia = Arachnophobia(Translation(Language.Fr, "Arachnophobie"), Translation(Language.De, "Arachnophobie (de)"));

        Assert.Equal("Arachnophobie", phobia.TranslationFor(Language.It).Name);
    }

    [Fact]
    public void MediaForLevel_returns_the_media_of_that_level_in_the_order_they_were_added()
    {
        var phobia = Arachnophobia();
        var cute = ExposureMedia.Image(1, "arachnophobia/1-a.webp");
        var close = ExposureMedia.Image(2, "arachnophobia/2-a.webp");
        var closer = ExposureMedia.Image(2, "arachnophobia/2-b.webp");
        var video = ExposureMedia.YouTube("dQw4w9WgXcQ");

        phobia.AddMedia(close);
        phobia.AddMedia(video);
        phobia.AddMedia(cute);
        phobia.AddMedia(closer);

        Assert.Equal([cute], phobia.MediaForLevel(1));
        Assert.Equal([close, closer], phobia.MediaForLevel(2));
        Assert.Equal([video], phobia.MediaForLevel(5));
    }
}
