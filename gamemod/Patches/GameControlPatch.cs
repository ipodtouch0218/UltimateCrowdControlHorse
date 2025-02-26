﻿using System;
using GameEvent;
using HarmonyLib;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(GameControl))]
    public class GameControlPatch {

        [HarmonyPatch("Start")]
        [HarmonyPostfix]
        public static void Start_Postfix() {
            CrowdControlMod.Instance.StartGame();
        }

        [HarmonyPatch("OnDestroy")]
        [HarmonyPostfix]
        public static void OnDestroy_Postfix() {
            CrowdControlMod.Instance.EndGame();
        }

        [HarmonyPatch("ToPlaceMode")]
        [HarmonyPostfix]
        public static void ToPlaceMode_Postfix() {
            CrowdControlMod.Instance.ToEditMode();
        }

        [HarmonyPatch("ToPlayMode")]
        [HarmonyPostfix]
        public static void ToPlayMode_Postfix() {
            CrowdControlMod.Instance.ToPlayMode();
        }

        [HarmonyPatch("handleEvent", new Type[] { typeof(GameEvent.GameEvent) })]
        [HarmonyPostfix]
        public static void handleEvent_Postfix(GameControl __instance, GameEvent.GameEvent e) {

            if (!(e is NetworkMessageReceivedEvent nmre)) {
                return;
            }
            if (!(nmre.ReadMessage is SpawnPlaceableEvent spe)) {
                return;
            }
            if (__instance.hasAuthority) {
                return;
            }

            if (CrowdControlMod.socketLogging.Value) {
                CrowdControlMod.Instance.log.LogInfo($"[SOCKET] Incoming SpawnPlaceableEvent: {spe}");
            }
            Placeable placeable = CrowdControlMod.Instance.SpawnPlaceable(spe.PrefabName, spe.Location, spe.Rotation, spe.FlipX, spe.FlipY, spe.ID);
            placeable.ID = spe.ID;
            placeable.UpdateChildIDs();
            placeable.SwitchColliderTo(ColliderModeEnum.PlacementPhase);

            __instance.StartCoroutine("initialPlacement");
        }
    }
}
