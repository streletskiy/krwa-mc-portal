use aster_texture_renderer::{
    OutputFormat, Skin2dPreviewOptions, SkinModel, SkinPreviewOptions, TexturePreviewOptions,
    render_preview, render_skin_preview, render_skin_preview_bytes,
};
use image::Rgba;

const ORANGE_SLIM_SKIN: &[u8] = include_bytes!("fixtures/skins/orange.png");
const BLUE_SLIM_SKIN: &[u8] = include_bytes!("fixtures/skins/blue.png");
const STEVE_SKIN: &[u8] = include_bytes!("fixtures/skins/steve.png");
const ALEX_SKIN: &[u8] = include_bytes!("fixtures/skins/alex.png");

#[test]
fn renders_real_indexed_and_rgba_skin_pngs() {
    let options = SkinPreviewOptions {
        output_width: 430,
        output_height: 430,
        background: Some(Rgba([255, 255, 255, 255])),
        ..SkinPreviewOptions::default()
    };

    let orange = render_skin_preview(ORANGE_SLIM_SKIN, SkinModel::Slim, &options).unwrap();
    let blue = render_skin_preview(BLUE_SLIM_SKIN, SkinModel::Slim, &options).unwrap();

    assert_eq!(orange.dimensions(), (430, 430));
    assert_eq!(blue.dimensions(), (430, 430));
    assert!(count_non_background(&orange, Rgba([255, 255, 255, 255])) > 18_000);
    assert!(count_non_background(&blue, Rgba([255, 255, 255, 255])) > 18_000);
    assert_ne!(orange.as_raw(), blue.as_raw());
}

#[test]
fn keeps_transparent_background_when_requested() {
    let options = SkinPreviewOptions {
        output_width: 320,
        output_height: 320,
        background: None,
        ..SkinPreviewOptions::default()
    };

    let preview = render_skin_preview(STEVE_SKIN, SkinModel::Default, &options).unwrap();

    assert!(preview.pixels().any(|pixel| pixel[3] == 0));
    assert!(preview.pixels().any(|pixel| pixel[3] == 255));
}

#[test]
fn camera_options_change_real_fixture_output() {
    let mut options = SkinPreviewOptions {
        output_width: 360,
        output_height: 360,
        ..SkinPreviewOptions::default()
    };
    let first = render_skin_preview(BLUE_SLIM_SKIN, SkinModel::Slim, &options).unwrap();

    options.pitch_degrees = -8.0;
    options.front_yaw_degrees = -70.0;
    options.back_yaw_degrees = 115.0;
    options.scale = 6.8;
    let second = render_skin_preview(BLUE_SLIM_SKIN, SkinModel::Slim, &options).unwrap();

    assert_ne!(first.as_raw(), second.as_raw());
}

#[test]
fn default_and_slim_models_render_differently() {
    let options = SkinPreviewOptions {
        output_width: 360,
        output_height: 360,
        ..SkinPreviewOptions::default()
    };

    let steve = render_skin_preview(STEVE_SKIN, SkinModel::Default, &options).unwrap();
    let alex = render_skin_preview(ALEX_SKIN, SkinModel::Slim, &options).unwrap();

    assert_ne!(steve.as_raw(), alex.as_raw());
}

#[test]
fn encodes_webp_bytes_from_real_fixture() {
    let bytes = render_skin_preview_bytes(
        BLUE_SLIM_SKIN,
        SkinModel::Slim,
        &SkinPreviewOptions::default(),
        OutputFormat::WebP,
    )
    .unwrap();

    assert!(bytes.starts_with(b"RIFF"));
    assert_eq!(&bytes[8..12], b"WEBP");
}

#[test]
fn high_level_preview_api_selects_2d_engine() {
    let options = TexturePreviewOptions::Skin2d(Skin2dPreviewOptions {
        output_width: 160,
        output_height: 160,
        padding: 16,
        view_spacing: 20,
        background: Some(Rgba([255, 255, 255, 255])),
        show_outer_layer: true,
    });

    let preview = render_preview(BLUE_SLIM_SKIN, SkinModel::Slim, &options).unwrap();

    assert_eq!(preview.dimensions(), (160, 160));
    assert_eq!(*preview.get_pixel(15, 15), Rgba([255, 255, 255, 255]));
    assert!(
        preview
            .pixels()
            .any(|pixel| *pixel != Rgba([255, 255, 255, 255]))
    );
}

fn count_non_background(image: &image::RgbaImage, background: Rgba<u8>) -> usize {
    image.pixels().filter(|pixel| **pixel != background).count()
}

#[test]
fn head_overlay_is_visible_for_legacy_modern_and_hd_skins_in_both_engines() {
    for (width, height) in [(64, 32), (64, 64), (128, 64), (128, 128)] {
        let scale = width / 64;
        let mut skin = image::RgbaImage::new(width, height);
        // Red base head, blue outer head (hair). Other regions stay transparent.
        for y in 0..16 * scale {
            for x in 0..64 * scale {
                skin.put_pixel(
                    x,
                    y,
                    if x < 32 * scale {
                        Rgba([240, 20, 20, 255])
                    } else {
                        Rgba([20, 20, 240, 255])
                    },
                );
            }
        }
        let mut png = std::io::Cursor::new(Vec::new());
        skin.write_to(&mut png, image::ImageFormat::Png).unwrap();
        for flat in [false, true] {
            for show_outer_layer in [false, true] {
                let options = if flat {
                    TexturePreviewOptions::Skin2d(Skin2dPreviewOptions {
                        show_outer_layer,
                        ..Skin2dPreviewOptions::default()
                    })
                } else {
                    TexturePreviewOptions::Skin3d(SkinPreviewOptions {
                        show_outer_layer,
                        ..SkinPreviewOptions::default()
                    })
                };
                let rendered = render_preview(png.get_ref(), SkinModel::Default, &options).unwrap();
                let blue_pixels = rendered
                    .pixels()
                    .filter(|p| p[3] > 0 && u16::from(p[2]) > u16::from(p[0]) * 2)
                    .count();
                assert_eq!(
                    blue_pixels > 0,
                    show_outer_layer,
                    "{width}x{height}, flat={flat}, outer={show_outer_layer}"
                );
            }
        }
    }
}
