using HarmonyLib;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(RaftDayNightCycle))]
    public class RaftDayNightCyclePatch {

        [HarmonyPatch(nameof(RaftDayNightCycle.DayTransition))]
        [HarmonyPostfix]
        public static void DayTransition_Postfix() {
            CrowdControlMod.Instance.ChangeLevel("Raft");
        }

        [HarmonyPatch(nameof(RaftDayNightCycle.NightTransition))]
        [HarmonyPostfix]
        public static void NightTransition_Postfix() {
            CrowdControlMod.Instance.ChangeLevel("Raft-Night");
        }
    }
}
