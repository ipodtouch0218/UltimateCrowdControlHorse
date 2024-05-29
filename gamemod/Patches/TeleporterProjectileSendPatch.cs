using HarmonyLib;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(Teleporter))]
    public class TeleporterProjectileSendPatch {

        [HarmonyPatch("ConnectToAnotherTeleporter")]
        [HarmonyPostfix]
        public static void ConnectToAnotherTeleporter_Postfix(Teleporter __instance) {
            PlaceablePatch.UpdatePlaceable(__instance);
            if (__instance.Destination) {
                PlaceablePatch.UpdatePlaceable(__instance.Destination);
            }
        }
    }
}
