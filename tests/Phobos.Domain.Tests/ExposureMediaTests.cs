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
        var media = ExposureMedia.Image(level, "arachnophobia/a.webp");

        Assert.Equal(level, media.Level);
        Assert.Equal(MediaKind.Image, media.Kind);
        Assert.Equal("arachnophobia/a.webp", media.Source);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    public void Images_are_refused_outside_levels_1_to_4(int level)
    {
        Assert.Throws<DomainRuleException>(() => ExposureMedia.Image(level, "arachnophobia/a.webp"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void An_image_needs_a_storage_key(string storageKey)
    {
        Assert.Throws<DomainRuleException>(() => ExposureMedia.Image(1, storageKey));
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
        Assert.Throws<DomainRuleException>(() => ExposureMedia.YouTube(videoId));
    }

    [Fact]
    public void A_video_accepts_hyphens_and_underscores_in_its_id()
    {
        Assert.Equal("a-b_c-d_e-f", ExposureMedia.YouTube("a-b_c-d_e-f").Source);
    }

    [Fact]
    public void A_video_cannot_start_before_zero()
    {
        Assert.Throws<DomainRuleException>(() => ExposureMedia.YouTube("dQw4w9WgXcQ", startSeconds: -1));
    }
}
