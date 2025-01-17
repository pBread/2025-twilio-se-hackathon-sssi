import { CustomizationProvider } from "@twilio-paste/core/customization";
import { FlexPlugin } from "@twilio/flex-plugin";

const PLUGIN_NAME = "Hackathon2025Plugin";

export default class RetailPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   */
  async init(flex, manager) {
    flex.setProviders({
      PasteThemeProvider: CustomizationProvider,
    });
  }
}
