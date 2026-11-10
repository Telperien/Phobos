namespace Phobos.Domain.Tests;

public sealed class ImageCreditTests
{
    private static readonly Uri Source = new("https://commons.wikimedia.org/wiki/File:Spider.jpg");

    [Fact]
    public void A_generated_image_owes_nothing_to_anyone()
    {
        var credit = ImageCredit.Generated;

        Assert.Equal((ImageOrigin.Generated, null, null, null), (credit.Origin, credit.Author, credit.License, credit.Source));
    }

    [Fact]
    public void An_image_found_on_the_web_keeps_its_author_licence_and_source()
    {
        var credit = ImageCredit.Licensed("CC BY 4.0", Source, author: "Jean Dupont");

        Assert.Equal((ImageOrigin.Web, "Jean Dupont", "CC BY 4.0", Source), (credit.Origin, credit.Author, credit.License, credit.Source));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("  ")]
    public void The_author_of_a_web_image_may_be_unknown(string? author)
    {
        Assert.Null(ImageCredit.Licensed("Public domain", Source, author).Author);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void A_web_image_needs_a_licence(string license)
    {
        var error = Assert.Throws<DomainRuleException>(() => ImageCredit.Licensed(license, Source, "Jean Dupont"));

        Assert.Contains("licence", error.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("/wiki/File:Spider.jpg")]
    [InlineData("ftp://example.org/spider.jpg")]
    [InlineData("file:///C:/images/spider.jpg")]
    public void A_web_image_needs_the_web_address_it_comes_from(string source)
    {
        var error = Assert.Throws<DomainRuleException>(() =>
            ImageCredit.Licensed("CC0", new Uri(source, UriKind.RelativeOrAbsolute), "Jean Dupont"));

        Assert.Contains("web address", error.Message, StringComparison.Ordinal);
    }
}
