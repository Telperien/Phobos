namespace Phobos.Domain.Tests;

public sealed class ExposureMediaTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    public void Images_belong_to_levels_1_to_4(int level)
    {
        var media = ExposureMedia.Image(level, "arachnophobia/a.webp", ImageCredit.Generated);

        Assert.Equal(level, media.Level);
        Assert.Equal(MediaKind.Image, media.Kind);
        Assert.Equal("arachnophobia/a.webp", media.Source);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    public void Images_are_refused_outside_levels_1_to_4(int level)
    {
        var error = Assert.Throws<DomainRuleException>(() => ExposureMedia.Image(level, "arachnophobia/a.webp", ImageCredit.Generated));

        Assert.Contains($"not {level}", error.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void An_image_needs_a_storage_key(string storageKey)
    {
        var error = Assert.Throws<DomainRuleException>(() => ExposureMedia.Image(1, storageKey, ImageCredit.Generated));

        Assert.Contains("storage key", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void An_image_carries_its_credit()
    {
        var credit = ImageCredit.Licensed("CC0", new Uri("https://example.org/spider"), author: null);

        Assert.Same(credit, ExposureMedia.Image(2, "arachnophobia/2-a.webp", credit).Credit);
    }

    [Fact]
    public void A_video_is_credited_by_youtube_itself()
    {
        Assert.Null(ExposureMedia.YouTube("dQw4w9WgXcQ").Credit);
    }

    [Fact]
    public void Videos_are_youtube_clips_on_level_5()
    {
        var media = ExposureMedia.YouTube("dQw4w9WgXcQ", startSeconds: 42);

        Assert.Equal(5, media.Level);
        Assert.Equal(MediaKind.YouTube, media.Kind);
        Assert.Equal("dQw4w9WgXcQ", media.Source);
        Assert.Equal(42, media.StartSeconds);
    }

    [Fact]
    public void A_video_starts_at_the_beginning_by_default()
    {
        Assert.Equal(0, ExposureMedia.YouTube("dQw4w9WgXcQ").StartSeconds);
    }

    [Theory]
    [InlineData("")]
    [InlineData("tooShort")]
    [InlineData("dQw4w9WgXcQx")]
    [InlineData("dQw4w9WgX?Q")]
    [InlineData("https://youtu.be/dQw4w9WgXcQ")]
    public void A_video_needs_an_11_character_youtube_id(string videoId)
    {
        var error = Assert.Throws<DomainRuleException>(() => ExposureMedia.YouTube(videoId));

        Assert.Contains($"'{videoId}'", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void A_video_accepts_hyphens_and_underscores_in_its_id()
    {
        Assert.Equal("a-b_c-d_e-f", ExposureMedia.YouTube("a-b_c-d_e-f").Source);
    }

    [Fact]
    public void A_video_cannot_start_before_zero()
    {
        var error = Assert.Throws<DomainRuleException>(() => ExposureMedia.YouTube("dQw4w9WgXcQ", startSeconds: -1));

        Assert.Contains("before zero", error.Message, StringComparison.Ordinal);
    }
}
