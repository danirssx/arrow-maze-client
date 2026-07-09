import { readFileSync } from "node:fs";
import { join } from "node:path";

type EasBuildProfile = {
  readonly extends?: string;
  readonly distribution?: string;
  readonly environment?: string;
  readonly channel?: string;
  readonly releaseChannel?: string;
  readonly autoIncrement?: boolean;
  readonly android?: {
    readonly buildType?: string;
  };
  readonly ios?: {
    readonly simulator?: boolean;
  };
};

type EasConfig = {
  readonly cli: {
    readonly version: string;
    readonly appVersionSource: string;
  };
  readonly build: Record<string, EasBuildProfile>;
};

function loadEasConfig(): EasConfig {
  return JSON.parse(readFileSync(join(process.cwd(), "eas.json"), "utf8")) as EasConfig;
}

function getProfile(config: EasConfig, name: string): EasBuildProfile {
  const profile = config.build[name];
  if (profile === undefined) {
    throw new Error(`Missing EAS build profile: ${name}`);
  }
  return profile;
}

describe("EAS build configuration", () => {
  it("should_define_android_and_ios_build_profiles_when_eas_config_is_loaded", () => {
    const config = loadEasConfig();
    const development = getProfile(config, "development");
    const preview = getProfile(config, "preview");
    const production = getProfile(config, "production");

    expect(Object.keys(config.build).sort()).toEqual(["base", "development", "preview", "production"]);
    expect(development).toMatchObject({
      distribution: "internal",
      environment: "development",
      android: { buildType: "apk" },
      ios: { simulator: true },
    });
    expect(preview).toMatchObject({
      distribution: "internal",
      environment: "preview",
      android: { buildType: "apk" },
    });
    expect(production).toMatchObject({
      distribution: "store",
      environment: "production",
      autoIncrement: true,
      android: { buildType: "app-bundle" },
    });
  });

  it("should_use_remote_versioning_when_production_builds_auto_increment", () => {
    const config = loadEasConfig();
    const production = getProfile(config, "production");

    expect(config.cli.appVersionSource).toBe("remote");
    expect(production.autoIncrement).toBe(true);
  });

  it("should_not_enable_eas_update_channels_when_profiles_are_inspected", () => {
    const config = loadEasConfig();

    for (const profile of Object.values(config.build)) {
      expect(profile.channel).toBeUndefined();
      expect(profile.releaseChannel).toBeUndefined();
    }
  });
});
