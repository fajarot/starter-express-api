import CyclicDb from "@cyclic.sh/dynamodb";
const DB_NAME = CyclicDb("shy-lamb-sun-hatCyclicDB");
import _ from "lodash";

const BASE_COLL = "production";
const LIST_KEY = {
  index: "index", // list SET  dari key channel
  channel: "channel", //
  medal: "medal",
  pro_player: "proplayer",
};

class My_db {
  constructor(coll = "temp", key = "index") {
    this.collect = DB_NAME.collection(coll);
    this.key = key;
  }

  changeDBCollection(coll = "temp") {
    this.collect = DB_NAME.collection(data);
  }

  changeDBKey(key = "index") {
    this.key = key ?? "temp";
  }

  async setDBData(data) {
    return await this.collect.set(this.key, data);
  }

  async getDBData() {
    return await this.collect.get(this.key);
  }

  async getAllData(indexArray = "") {
    try {
      let {
        props: { data },
      } = await this.getDBData();

      return data.constructor == Array && indexArray != ""
        ? data[indexArray]
        : data;
    } catch (error) {
      return false;
    }
  }

  async saveData(data) {
    let {
      props: { data: newData },
    } = await this.setDBData({ data });
    return newData;
  }

  isSameData(arrayA, arrayB) {
    return arrayA.toString() == arrayB.toString();
  }
}

class HistoryClass extends My_db {
  constructor() {
    super(BASE_COLL, LIST_KEY.index);
  }

  // CHANGE WITH LODASH FOR EZ DATA
  detailMethod(arr, name, val) {
    let index = _.findIndex(arr, (o) => o.name == name);
    let pos = "[" + index + "]request";

    let data = {
      name: name,
      request: _.union(_.get(arr, pos, []), [val]),
    };

    return _.unionBy([data], arr, "name");
  }

  countTotalMethod(arr, name) {
    let index = _.findIndex(arr, (o) => o.name == name);
    let pos = "[" + index + "]count";

    let data = {
      name: name,
      count: _.get(arr, pos, 0) + 1,
    };

    return _.unionBy([data], arr, "name");
  }

  async addToIndex(channel, name, dota_id) {
    let oldData = await this.getAllData();
    let temp = {
      channel: [],
      user: [],
      dota_id: [],
      totalChannel: [],
      totalUser: [],
      detailChannel: [],
      detailUser: [],
    };

    temp.channel = _.union(oldData.channel, [channel]);
    temp.user = _.union(oldData.user, [name]);
    temp.dota_id = _.union(oldData.dota_id, [dota_id]);

    temp.totalChannel = this.countTotalMethod(oldData.totalChannel, channel);
    temp.totalUser = this.countTotalMethod(oldData.totalUser, name);

    temp.detailChannel = this.detailMethod(
      oldData.detailChannel,
      channel,
      name
    );
    temp.detailUser = this.detailMethod(oldData.detailUser, name, dota_id);

    let newData = await this.saveData(temp);

    return temp;
  }
}

class RandomClass extends My_db {
  constructor(coll, key) {
    super(coll, key);
  }

  randomData(data) {
    if (data.constructor == String) return data;
    return data[
      Object.keys(data)[Math.floor(Math.random() * Object.keys(data).length)]
    ];
  }

  async randomThis() {
    let data = await this.getAllData();
    return this.randomData(data);
  }
}

class MedalHandler extends RandomClass {
  constructor() {
    super(BASE_COLL, LIST_KEY.medal);
  }

  async tambahMedal(index, kalimat) {
    let oldData = await this.getAllData();
    if (!oldData) {
      oldData = [[kalimat]];
    } else {
      oldData.length <= index
        ? oldData.push([kalimat])
        : oldData[index].push(kalimat);
    }

    let newData = await this.saveData(oldData);
    return this.isSameData(newData, oldData);
  }

  async gantiKataBaru(index, kalimat) {
    let oldData = await this.getAllData();
    if (oldData.length <= index) oldData[index] = [kalimat];
    let newData = await this.saveData(oldData);
    return this.isSameData(newData, oldData);
  }
}

class ProPlayerHandler extends RandomClass {
  constructor() {
    super(BASE_COLL, LIST_KEY.pro_player);
  }

  async tambahProPlayer(name, dota_id) {
    let oldData = await this.getAllData();
    if (!oldData) {
      oldData = { [name]: dota_id };
    } else {
      oldData[name] = dota_id;
    }
    let newData = await this.saveData(oldData);
    return this.isSameData(oldData, newData);
  }

  async deleteProPlayer(name) {
    let oldData = await this.getAllData();
    if (oldData[name] == undefined) return false;
    delete oldData[name];
    let newData = await this.saveData(oldData);
    return this.isSameData(oldData, newData);
  }
}

// const tes = new MedalHandler();
// const tes = new ProPlayerHandler();
// const tes = new HistoryClass();
// const tes = new My_db(BASE_COLL, "inidek");

// let type = "ini data nama";
// let value = new Set(["asu", "kirik", "anjing"]);

// let data = [
//   ["Gak Pernah Maen RANK"],
//   ["Herbal"],
//   ["Guardian"],
//   ["Crusadog"],
//   ["Archontol"],
//   ["Legentod"],
//   ["Ancien si paling jago", "Ancien medal pubertas"],
//   ["Divine Gendongan"],
//   ["Immortal"],
// ];
// let data = {
//   rusman: 331999484,
//   iyd: 181716137,
//   mocel: 389033587,
//   ramji: 122255316,
//   julio: 180011187,
//   cije: 162539779,
// };

// let d = { data };
// let babi = {
//   channel: "asw",
//   user: "gatot",
// };
// let d = { babi };
// let {
//   props: { data: val },
// } = await tes.setDBData(d);

// console.log(val);

// console.log(await tes.getDBData());
// console.log(await tes.setDBData(d));
// console.log(await tes.addToIndex("dsdawasdda", "asd", "512412133667"));
// console.log(await tes.addToDB("kucing"));
// console.log(await tes.getAllData());
// console.log(await tes.getDBData());
// console.log(await tes.saveData(data));

// console.log(await tes.addToIndex("kuciqwnadsg kasdaawin", "flswad2x"));
// console.log(await tes.tambahMedal(6, "qwgqgqsdasdasdsaegewf"));
// console.log(await tes.gantiKataBaru());
// console.log(await tes.getAllData());
// console.log(await tes.deleteProPlayer("babang"));
// console.log(await tes.tambahProPlayer("afaffwf", 57233564234));
// console.log(await tes.gantiKataBaru(3, "spam luh taik"));

export { My_db, MedalHandler, ProPlayerHandler, HistoryClass };
