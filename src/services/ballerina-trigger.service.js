import axios from "axios";

class BallerinaTriggerService {
  _ballerinaCentralAPIURL;

  constructor(env, id, isHttpBased) {
    this.env = env;
    this._ballerinaCentralAPIURL = this.getCentralAPIURLByEnv();
    this.id = id;
    this.isHttpBased = isHttpBased;
  }

  async getFilteredTriggers() {
    console.log("getting filtered triggers ......");
    try {
      const triggers = await this.getTriggersByID(this.id);
      console.log("Triggers size : ", triggers.serviceTypes.length);

      if (!triggers.serviceTypes.length) {
        return new Error("No triggers found");
      }
      const filteredBallerinaServices = [];

      if (triggers.serviceTypes) {
        triggers.serviceTypes.forEach((serviceType) => {
          const serviceTypeName = serviceType.name;
          Object.values(triggers).filter((triggerChannel) => {
            if (serviceTypeName.includes(triggerChannel)) {
              filteredBallerinaServices.push(serviceType);
            }
          });
        });

        triggers.triggerType = triggers?.moduleName.split(".").pop();

        triggers.httpBased = this.isHttpBased;
      }
      triggers.serviceTypes = filteredBallerinaServices;

      return triggers;
    } catch (e) {
      console.error("Failed to get filtered triggers", e);
      throw e;
    }
  }

  async getTriggersByID(id) {
    const PATH = `${this._ballerinaCentralAPIURL}/2.0/registry/triggers/${id}`;
    try {
      console.log("getting triggers by id ......");
      const res = await axios.get(PATH);
      console.log("Triggers  data : ", res.data);
      return res.data;
    } catch (e) {
      console.error(
        `Failed to get ballerina triggers : trigger ID ${id} : [%o]`,
        e.message
      );
      throw e;
    }
  }

  getCentralAPIURLByEnv() {
    let url = "";
    switch (this.env) {
      case "dev":
      case "DEV":
        url = "https://api.dev-central.ballerina.io";
        break;
      case "stage":
      case "STAGE":
        url = "https://api.staging-central.ballerina.io";
        break;
      case "prod":
      case "PROD":
        url = "https://api.central.ballerina.io";
        break;
      default:
        throw new Error(`Invalid environment ${this.env}`);
    }
    return url;
  }
}

export { BallerinaTriggerService };
