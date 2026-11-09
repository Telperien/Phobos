namespace Phobos.Domain.Tests;

public sealed class LanguageTests
{
    [Theory]
    [InlineData("fr", Language.Fr)]
    [InlineData("en", Language.En)]
    [InlineData("es", Language.Es)]
    [InlineData("de", Language.De)]
    [InlineData("it", Language.It)]
    [InlineData("FR", Language.Fr)]
    public void Supported_codes_are_recognised_whatever_their_case(string code, Language expected)
    {
        Assert.True(Languages.TryParse(code, out var language));
        Assert.Equal(expected, language);
    }

    [Theory]
    [InlineData("pt")]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("1")]
    public void Unsupported_codes_are_refused(string? code)
    {
        Assert.False(Languages.TryParse(code, out _));
    }

    [Fact]
    public void Each_language_has_its_two_letter_code()
    {
        Assert.Equal(["fr", "en", "es", "de", "it"], Languages.All.Select(Languages.Code));
    }
}
