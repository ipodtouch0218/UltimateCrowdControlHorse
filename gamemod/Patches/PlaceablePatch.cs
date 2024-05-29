using HarmonyLib;
using System;
using System.Collections.Generic;
using System.Linq;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(Placeable))]
    public class PlaceablePatch {

        [HarmonyPatch("Place", new Type[] { typeof(int), typeof(bool), typeof(bool) })]
        [HarmonyPostfix]
        public static void Place_Postfix(Placeable __instance) {
            UpdatePlaceable(__instance);
        }

        [HarmonyPatch("PickUp")]
        [HarmonyPostfix]
        public static void PickUp_Postfix(Placeable __instance) {
            CrowdControlMod.Instance.log.LogInfo(__instance.ID + " - Pickup()");
            RemovePlaceable(__instance);
        }

        [HarmonyPatch("OnDestroy")]
        [HarmonyPostfix]
        public static void OnDestroy_Postfix(Placeable __instance) {
            CrowdControlMod.Instance.log.LogInfo(__instance.ID + " - OnDestroy()");
            RemovePlaceable(__instance);
        }

        public static void UpdatePlaceable(Placeable p) {
            if (!SerializedPlaceable.IsValid(p)) {
                // Not eligable; not a real placed item (or is a map element)
                CrowdControlMod.Instance.log.LogInfo($"{p.name} ({p.Name}) is not eligable {!p.Placed} || {p.PickedUp} || {p.isSetPiece} || {!p.Enabled}!");
                return;
            }

            CrowdControlMod.Instance.pendingUpdates.Add(new SerializedPlaceable(p));
        }

        public static void RemovePlaceable(Placeable p) {
            // Even if it's not eligable, remove it regardless, just in case. It's just a single integer, after all.
            CrowdControlMod.Instance.pendingRemovals.Add(p.ID);
        }

        public static void UpdateAllPlaceables() {
            List<SerializedPlaceable> allPlaceables = Placeable.AllPlaceables
                .Where(p => SerializedPlaceable.IsValid(p))
                .Select(p => new SerializedPlaceable(p)) // THIS works... but .Cast<> doesnt. yeah.
                .ToList();

            CrowdControlMod.Instance.SendSocketMessage("updateAllPlaceables", allPlaceables);
        }
    }
}
