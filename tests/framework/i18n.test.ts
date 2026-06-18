import { i18n } from "@/framework/i18n/i18n";

describe("i18n setup", () => {
  it("should_return_default_title_when_translation_is_loaded", () => {
    // Arrange
    const key = "app.title";

    // Act
    const title = i18n.t(key);

    // Assert
    expect(title).toBe("Arrow Maze");
  });
});

