using GameEvent;
using HarmonyLib;
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(PiecePlacementCursor))]
    public class PiecePlacementCursorPatch {

        public static PickBlockEvent Event;
        public static object[] Information;
        public static bool HandlingOurEvent;

        [HarmonyPatch("handleEvent", new Type[] { typeof(GameEvent.GameEvent) })]
        [HarmonyPrefix]
        public static bool handleEvent_Prefix(PiecePlacementCursor __instance, GameEvent.GameEvent e) {

            if (Event == null || !(e is PickBlockEvent ee) || ee.PickablePiece != Event.PickablePiece) {
                return true;
            }
            if (ee.PlayerNumber != __instance.networkNumber) {
                return true;
            }
            if (GameSettings.GetInstance().GameMode != GameState.GameMode.PARTY) {
                return true;
            }

            var log = CrowdControlMod.Instance.log;
            log.LogInfo("Handlign OUr Event!");
            HandlingOurEvent = true;
            return true;
        }

        [HarmonyPatch("handleEvent", new Type[] { typeof(GameEvent.GameEvent) })]
        [HarmonyPostfix]
        public static void handleEvent_Postfix(PiecePlacementCursor __instance, GameEvent.GameEvent e) {
            var log = CrowdControlMod.Instance.log;

            if (Event == null || !(e is PickBlockEvent ee) || ee.PickablePiece != Event.PickablePiece) {
                return;
            }
            if (ee.PlayerNumber != __instance.networkNumber) {
                return;
            }

            log.LogInfo("HANDLE EVENT WE GOT TO IT!");

            // This is our event.. fuck yeah
            // Ok. so at this point, we created a new placeable from the pickblock.
            Placeable piece = __instance.Piece;

            Vector2 location = (Vector2) Information[1];
            int rotation = (int) Information[2];
            bool flipX = (bool) Information[3];
            bool flipY = (bool) Information[4];

            if (piece is FerrisWheel w) {
                w.Clockwise = !flipX;
                flipX = false;
            } else if (piece is RotateBlock r) {
                r.Clockwise = !flipX;
                //flipX = false;
            } else if (piece is Bomb b) {
                b.Enable();
            }

            piece.transform.position = location;
            piece.transform.rotation = Quaternion.Euler(0f, 0f, Mathf.Round(rotation / 90f) * 90f);
            piece.transform.localScale = new Vector3(flipX ? -1 : 1, flipY ? -1 : 1, 1);

            // Bodge: force a collision update
            IEnumerable<CheckColliding> colliders = (IEnumerable<CheckColliding>) piece.GetType().GetField("PlacementCollidersNew", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic).GetValue(piece);
            var fixedUpdate = typeof(CheckColliding).GetMethod("FixedUpdate", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            foreach (CheckColliding collider in colliders) {
                fixedUpdate.Invoke(collider, new object[0] { });
            }

            /* if (piece.CanPlace()) { */
                MsgPiecePlaced msgPiecePlaced = new MsgPiecePlaced {
                    PlayerNumber = 0,
                    PiecePosition = piece.transform.position,
                    PieceScale = piece.transform.localScale,
                    PieceRotation = piece.transform.rotation,
                    PieceID = piece.ID,
                    PieceWasMoved = piece.Placed
                };
                NetworkManager.singleton.client.Send(NetMsgTypes.PiecePlaced, msgPiecePlaced);

                log.LogInfo("PLACED");
                CrowdControlMod.Instance.SendSocketMessage("placeResult", (string) Information[0], true, CrowdControlMod.buildCooldown.Value);
            /*
            } else {
                log.LogInfo("NOT PLACED (CANT?)");
                CrowdControlMod.Instance.SendSocketMessage("placeResult", (string) Information[0], false);
                typeof(PiecePlacementCursor).GetMethod("OnBack", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic).Invoke(__instance, new object[0]);
            }
            */
            Event = null;
            Information = null;
        }
    }
}
