using HarmonyLib;
using System;
using System.Collections.Generic;
using System.Linq;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(Placeable))]
    public class PlaceablePatch {

        [HarmonyPatch("Place", new Type[] { typeof(int), typeof(bool), typeof(bool) })]
        [HarmonyPostfix]
        public static void Place_Postfix() {
            UpdatePlaceableList();
        }

        [HarmonyPatch("PickUp")]
        [HarmonyPostfix]
        public static void PickUp_Postfix() {
            UpdatePlaceableList();
        }

        [HarmonyPatch("OnDestroy")]
        [HarmonyPostfix]
        public static void OnDestroy_Postfix() {
            UpdatePlaceableList();
        }

        public static void UpdatePlaceableList() {
            List<SerializedPlaceable> allPlaceables = Placeable.AllPlaceables
                .Where(p => p.Placed && !p.PickedUp && !string.IsNullOrWhiteSpace(p.Name))
                .Select(p => (SerializedPlaceable) p) // THIS works... but .Cast<> doesnt. yeah.
                .ToList();

            var ccm = CrowdControlMod.Instance;
            ccm.log.LogInfo($"New number of placeables: {allPlaceables.Count}");

            ccm.SendSocketMessage("updatePlaceables", allPlaceables);
        }
    }
}
