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
            if (CrowdControlMod.socketLogging.Value) {
                CrowdControlMod.Instance.log.LogInfo($"[Place] __instance.name {__instance.ID}");
            }
            UpdatePlaceable(__instance);
        }

        [HarmonyPatch("PickUp")]
        [HarmonyPostfix]
        public static void PickUp_Postfix(Placeable __instance) {
            if (CrowdControlMod.socketLogging.Value) {
                CrowdControlMod.Instance.log.LogInfo($"[PickUp] __instance.name {__instance.ID}");
            }
            RemovePlaceable(__instance);
        }

        [HarmonyPatch("OnDestroy")]
        [HarmonyPostfix]
        public static void OnDestroy_Postfix(Placeable __instance) {
            if (CrowdControlMod.socketLogging.Value) {
                CrowdControlMod.Instance.log.LogInfo($"[OnDestroy] __instance.name {__instance.ID}");
            }
            RemovePlaceable(__instance);
        }

        public static void UpdatePlaceable(Placeable p) {
            if (!SerializedPlaceable.IsValid(p)) {
                // Not eligable; not a real placed item (or is a map element)
                if (p.GetComponentInParent<FerrisWheel>() is FerrisWheel fw) {
                    // Update ferris wheel platforms via the parent.
                    p = fw;
                    goto updateAnyway;
                }
                return;
            }

            updateAnyway:
            CrowdControlMod.Instance.pendingUpdates.Add(new SerializedPlaceable(p));
        }

        public static void RemovePlaceable(Placeable p) {
            // Even if it's not eligable, remove it regardless, just in case. It's just a single integer, after all.
            CrowdControlMod.Instance.pendingRemovals.Add(p.ID);
        }

        public static void UpdateAllPlaceables() {
            List<SerializedPlaceable> allPlaceables = Placeable.AllPlaceables
                .Where(SerializedPlaceable.IsValid)
                .Select(p => new SerializedPlaceable(p)) // THIS works... but .Cast<> doesnt. yeah.
                .ToList();

            CrowdControlMod.Instance.SendSocketMessage("updateAllPlaceables", allPlaceables);
        }
    }
}
