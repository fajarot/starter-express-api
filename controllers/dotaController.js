import axios from "axios";
import {
  MedalHandler,
  ProPlayerHandler,
  HistoryClass,
} from "../database/cyclicDB.js";
import _ from "lodash";

import moment from "moment";
moment().utcOffset("+07:00");
moment.locale("id");

let config = {
  headers: {
    Authorization: "Bearer " + process.env.TOKEN,
  },
};

async function randomPlayer() {
  try {
    let player = new ProPlayerHandler();
    if ((await player.getAllData()) == false) throw new Error();
    return await player.randomThis();
  } catch (error) {
    console.log("gagal random player dari database");
  }

  let pro_id = {
    rusman: 331999484,
    iyd: 181716137,
    mocel: 389033587,
    ramji: 122255316,
    julio: 180011187,
    cije: 162539779,
  };
  return pro_id[
    Object.keys(pro_id)[Math.floor(Math.random() * Object.keys(pro_id).length)]
  ];
}
// console.log(await randomPlayer());

async function paramFilter(param) {
  return !isNaN(param) && param.length != 0 ? param : await randomPlayer();
}

async function randomMedal(index) {
  try {
    let medal = new MedalHandler();
    let data = await medal.getAllData(index);
    if (data == false) throw new Error();
    return await medal.randomData(data);
  } catch (error) {
    console.log("gagal random Medal dari database");
  }

  let arr = [
    "Gak Pernah Maen RANK",
    "Herbal",
    "Guardian",
    "Crusadog",
    "Archontol",
    "Legentod",
    "Ancien si paling jago",
    "Divine Gendongan",
    "Immortal",
  ];
  return arr[index];
}
// console.log(await randomMedal("6"));

async function switchRespon(respon, method) {
  let result;
  let data =
    respon.status == 200
      ? respon.data
      : respon.status == 204
      ? { error: "Id palsu taiiik 😡" }
      : { error: "Server Error" };

  if (data.error) {
    result = data.error;
  } else {
    let medal = data.steamAccount.seasonRank;
    method = method.length < 2 && medal == 80 ? "medal" : method;
    switch (method.toLowerCase()) {
      case "steam":
        result = " | STEAM PROFILE : " + data.steamAccount.profileUri;
        break;
      case "null":
      case "medal":
        let seasonRank = data.steamAccount.seasonLeaderboardRank;
        let imo = medal == 80 && seasonRank ? " | RANK : -+" + seasonRank : " ";
        result =
          " | MEDAL : " +
          (await randomMedal(medal?.toString()[0] ?? "0")) +
          imo;
        break;
      case "private":
        result =
          !data.steamAccount.isAnonymous && !data.steamAccount.isStratzAnonymous
            ? " | Akun ini Tidak Private"
            : " | Akun ini Private";
        break;
      case "smurf":
      default:
        result =
          " | Smurf Flag : " +
          data.steamAccount.smurfFlag +
          " | Check Date : " +
          moment
            .unix(data.steamAccount.smurfCheckDate)
            .format("dddd Do MMMM YYYY");
    }

    result = "NAME : " + data.steamAccount.name + result;
  }

  return result;
}

async function rankHandler(respon, time) {
  // console.log(respon.status);
  let data =
    respon.status == 403
      ? { error: "This Account is Private" }
      : respon.status == 200 && _.isNil(respon.data.allTime.matches.date)
      ? { error: "Id palsu taiiik 😡" }
      : respon.data.allTime.matches;

  let result;

  if (data.error) {
    result = data.error;
  } else {
    let win = data.win;
    let lose = data.matchCount - data.win;
    let WinRate = (win / data.matchCount) * 100;
    let lastDate = moment.unix(data.date).format("Do MMM h:mm");
    let fromDate = moment.unix(time).format("Do MMM");

    result = `Recent Ranked Match Dari ${fromDate} Sampe ${lastDate} | Total Match : ${
      data.matchCount
    } | WIN : ${win} | LOSE : ${lose} | WINRATE : ${WinRate.toFixed(2)}%`;
  }

  return result;
}

export const getDotaInfo = async (req, res) => {
  // URL/req_id?dota_id=123&method=steam&name=ytname
  const channel = req.params.channel_name; // channel_id + user_id;
  const dota_id = await paramFilter(req.query.dota_id);
  const method = req.query.method.toLowerCase();
  const name = req.query.name ?? "empty";

  let data;
  let result;

  let saveToDB = new HistoryClass();

  // console.log(channel, dota_id, method);

  try {
    // DEADLINE
    if (method.includes("rank")) {
      let hours = method.split("rank")[1];
      hours = hours != "" && !isNaN(hours) ? hours : 24;
      let dateNow = moment().subtract(hours, "hours").unix();
      // console.log(hours);
      data = await axios.get(
        "https://api.stratz.com/api/v1/Player/" +
          dota_id +
          "/summary?startDateTime=" +
          dateNow +
          "&gameMode=22",
        config
      );

      console.log('RANK => ', data);
      result = await rankHandler(data, dateNow);
    } else {
      data = await axios.get(
        "https://api.stratz.com/api/v1/Player/" + dota_id,
        config
      );

      console.log('NORMAL => ', data);
      result = await switchRespon(data, method);
    }
  } catch (error) {
    if (method.includes("rank")) return res.status(400).send("Id ini Private");
    data = error.response;
    console.log('ERROR => ',data);
  }

  res.status(200).send(result);

  await saveToDB.addToIndex(channel, name, dota_id);

  // console.log(await saveToDB.getAllData());

  //   res.send(result);
};

export const getHome = async (req, res) => {
  res.status(200).send("<h1>Hello This is HomePage</h1>");
  console.log("HALOO");
};

export const tambahData = async (req, res) => {
  const channel = req.params.data_name;
  let name = req.query.name;
  let dota_id = req.query.dota_id;

  let methodList = ["player", "medal"];
  let respon;

  if (_.isNil(name) || _.isNil(dota_id)) {
    respon = `Wrong Query must have = name=(String) dota_id=(number)`;
    return res.status(400).json({ message: respon });
  }

  switch (channel.toLowerCase()) {
    case "player":
      let pro = new ProPlayerHandler();
      if (!(await pro.tambahProPlayer(name, dota_id))) {
        respon = `data gagal di simpan`;
        return res.status(503).json({ message: respon });
      }

      break;
    case "medal":
      let medal = new MedalHandler();
      if (!(await medal.tambahMedal(dota_id, name))) {
        respon = `data gagal di simpan`;
        return res.status(503).json({ message: respon });
      }

      break;
    default:
      respon = `Wrong Method Allowed, Change to Available Method List : ${methodList.toString()}`;
      return res.status(400).json({ message: respon });
  }

  respon = `data Pro Player berhasil disimpan : nama = ${name} | dota_id = ${dota_id}`;
  return res.status(201).json({ message: respon });
};

export const showData = async (req, res) => {
  const data_name = req.params.data_name;
  let data;

  switch (data_name.toLowerCase()) {
    case "medal":
      data = new MedalHandler();
      break;
    case "player":
      data = new ProPlayerHandler();
      break;
    case "user":
    default:
      data = new HistoryClass();
  }

  let respon = await data.getAllData();
  // console.log(await data.getDBData());
  res.status(200).json(respon != false ? respon : { message: "kosong" });
};
