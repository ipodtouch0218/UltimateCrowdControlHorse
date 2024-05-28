using HarmonyLib;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(Teleporter))]
    public class TeleporterProjectileSendPatch {

        [HarmonyPatch("ConnectToAnotherTeleporter")]
        [HarmonyPostfix]
        public static void ConnectToAnotherTeleporter_Postfix() {
            PlaceablePatch.UpdatePlaceableList();
        }
    }
}
