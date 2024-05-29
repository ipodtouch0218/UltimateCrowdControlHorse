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

        [HarmonyPatch("ToPlayMode")]
        [HarmonyPostfix]
        public static void ToPlayMode_Postfix(GameControl __instance) {

        }
    }
}
