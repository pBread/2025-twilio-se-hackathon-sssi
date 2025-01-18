import { CustomizationProvider } from "@twilio-paste/core/customization";
import { FlexPlugin } from "@twilio/flex-plugin";
import RetailWrapper from "./components/RetailWrapper";

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
    window.STORE = manager?.store;

    flex.setProviders({ PasteThemeProvider: CustomizationProvider });

    flex.AgentDesktopView.defaultProps.splitterOptions = {
      initialFirstPanelSize: "500px",
      minimumSecondPanelSize: "1200px",
    };

    const conf = {
      fnBaseUrl: manager.store.getState().flex.config.fnBaseUrl,
    };

    flex.CRMContainer.Content.replace(
      <RetailWrapper key={`${PLUGIN_NAME}-wrapper}`} conf={conf} />
    );
  }
}
