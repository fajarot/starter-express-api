import Express from "express";

import {
  getDotaInfo,
  getHome,
  tambahData,
  showData,
} from "../controllers/dotaController.js";

import { tesOpenAI } from "../controllers/openai.js";

const router = Express.Router();

router.get("/", getHome);
router.get("/home", getHome);

router.get("/dota/:channel_name", getDotaInfo);

router.get("/add/:data_name", tambahData);

router.get("/show/:data_name", showData);

router.get("/openai", tesOpenAI);

export default router;
