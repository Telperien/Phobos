using Phobos.Domain;

namespace Phobos.Application.Tests;

public sealed class CategoryCodesTests
{
    [Theory]
    [InlineData(Category.Animals, "animals")]
    [InlineData(Category.NatureAndSpaces, "nature-and-spaces")]
    [InlineData(Category.BodyAndHealth, "body-and-health")]
    [InlineData(Category.Strange, "strange")]
    public void Each_category_has_a_url_friendly_code(Category category, string code)
    {
        Assert.Equal(code, CategoryCodes.Code(category));
        Assert.True(CategoryCodes.TryParse(code, out var parsed));
        Assert.Equal(category, parsed);
    }

    [Theory]
    [InlineData("Animals")]
    [InlineData("monsters")]
    [InlineData("")]
    [InlineData(null)]
    public void Unknown_codes_are_refused(string? code)
    {
        Assert.False(CategoryCodes.TryParse(code, out _));
    }
}
