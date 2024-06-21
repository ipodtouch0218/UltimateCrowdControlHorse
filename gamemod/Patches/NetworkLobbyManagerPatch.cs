using HarmonyLib;
using System;
using UnityEngine.Networking;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(NetworkLobbyManager))]
    public class NetworkLobbyManagerPatch {

        [HarmonyPatch("OnServerSceneChanged", new Type[] { typeof(string) })]
        [HarmonyPostfix]
        public static void OnServerSceneChanged_Postfix(string sceneName) {
            CrowdControlMod.Instance.ChangeLevel(sceneName);
        }
    }
}
