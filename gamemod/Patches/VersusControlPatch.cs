using HarmonyLib;
using System.Reflection;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(VersusControl))]
    public class VersusControlPatch {

        private static FieldInfo TimerField;

        [HarmonyPatch("playersLeftToPlace", MethodType.Getter)]
        [HarmonyPostfix]
        public static void playersLeftToPlace_Getter(VersusControl __instance, ref bool __result) {

            if (TimerField == null) {
                TimerField = typeof(VersusControl).GetField("placementTimer", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            float placementTimer = (float) TimerField.GetValue(__instance);

            if (CrowdControlMod.Instance.IsConnected && placementTimer > 0) {
                // Give them time to place objects...
                __result = true;
            }
        }

    }
}
