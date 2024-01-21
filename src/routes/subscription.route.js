import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
} from '../controllers/subscription.controller.js'

const router = Router();


router.route('/:channelId').post(verifyJWT,toggleSubscription)
router.route('/c/:channelId').get(getUserChannelSubscribers)
router.route('/s/:subscriberId').get(getSubscribedChannels)

export default router