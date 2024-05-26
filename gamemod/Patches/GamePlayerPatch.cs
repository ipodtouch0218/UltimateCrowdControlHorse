using HarmonyLib;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(GameControl))]
    public class GameControlPatch {

        [HarmonyPatch("Start")]
        [HarmonyPostfix]
        public static void Start_Postfix(GameControl __instance) {
            CrowdControlMod.Instance.log.LogInfo("GameControl start!");
        }

        [HarmonyPatch("ToPlayMode")]
        [HarmonyPostfix]
        public static void ToPlayMode_Postfix(GameControl __instance) {
            CrowdControlMod.Instance.log.LogInfo($"Now in play mode!");
        }
    }
}
