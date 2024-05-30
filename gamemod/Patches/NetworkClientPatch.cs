using HarmonyLib;
using System;
using UnityEngine.Networking;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(NetworkClient))]
    public class NetworkClientPatch {

        [HarmonyPatch("Send", new Type[] { typeof(short), typeof(MessageBase) })]
        [HarmonyPrefix]
        public static bool Send_Prefix(short msgType, MessageBase msg) {
            if (PiecePlacementCursorPatch.HandlingOurEvent && msgType == NetMsgTypes.SetPartyPieceID) {

                var log = CrowdControlMod.Instance.log;
                log.LogInfo("Blocked outgoing SetPartyPiece event!!");
                PiecePlacementCursorPatch.HandlingOurEvent = false;
                return false;
            }

            return true;
        }

    }
}
