using HarmonyLib;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(PlaceableMetadataList))]
    public class PlaceableMetadataListPatch {

        [HarmonyPatch("Awake")]
        [HarmonyPostfix]
        public static void Awake_Postfix() {
            CrowdControlMod.Instance.FindPlaceables();
        }

    }
}
