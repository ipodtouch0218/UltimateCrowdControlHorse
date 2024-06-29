using HarmonyLib;
using UnityEngine;
using UnityEngine.UI;
using Vector2 = UnityEngine.Vector2;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(TabletLobbyOptionsScreen))]
    internal class TabletLobbyOptionsScreenPatch {

        public static bool crowdControlUrlShown;
        public static Text crowdControlUrlText, urlHintText;
        private static RectTransform inviteGroup, freezeGroup;
        private static RectTransform urlRectTransform;
        private static Vector2 urlOriginalAnchorMin, urlOriginalAnchorMax;

        [HarmonyPatch(nameof(TabletLobbyOptionsScreen.Start))]
        [HarmonyPostfix]
        public static void Start_Postfix(TabletLobbyOptionsScreen __instance) {
            CrowdControlMod.Instance.log.LogInfo(__instance);

            Transform screen = __instance.transform.GetChild(1);
            RectTransform lobbyCode = screen.GetChild(3).GetComponent<RectTransform>();
            freezeGroup = screen.GetChild(4).GetComponent<RectTransform>();
            inviteGroup = screen.GetChild(5).GetComponent<RectTransform>();

            lobbyCode.offsetMin += Vector2.up * 75;

            GameObject urlGroup = GameObject.Instantiate(lobbyCode.gameObject, lobbyCode.parent, true);
            urlGroup.name = "Crowd Control Url Group";
            RectTransform urlGroupRt = urlGroup.GetComponent<RectTransform>();
            urlGroupRt.anchoredPosition += Vector2.down * 335;
            urlHintText = urlGroupRt.GetChild(2).GetComponent<Text>();

            TabletButtonEvent toggle = new TabletButtonEvent();
            toggle.AddListener(ToggleCrowdControlUrl);
            urlGroupRt.GetChild(0).GetComponent<TabletButton>().OnClick = toggle;
            crowdControlUrlText = urlGroupRt.GetChild(0).GetComponentInChildren<Text>();
            urlRectTransform = urlGroupRt.GetChild(0).GetComponent<RectTransform>();
            urlOriginalAnchorMin = urlRectTransform.anchorMin;
            urlOriginalAnchorMax = urlRectTransform.anchorMax;
            TabletButtonEvent copy = new TabletButtonEvent();
            copy.AddListener(CopyCrowdControlUrl);
            urlGroupRt.GetChild(1).GetComponent<TabletButton>().OnClick = copy;

            CrowdControlMod.Instance.log.LogInfo(crowdControlUrlText.fontSize);

            freezeGroup.anchoredPosition += Vector2.down * 255;
            freezeGroup.offsetMin += Vector2.up * 50;
            RectTransform freezeText = freezeGroup.GetChild(0).GetComponent<RectTransform>();
            freezeText.offsetMin += Vector2.up * 10;

            crowdControlUrlShown = false;
            OnTransitionInBegin_Postfix(__instance);
        }

        [HarmonyPatch(nameof(TabletLobbyOptionsScreen.OnTransitionInBegin))]
        [HarmonyPostfix]
        public static void OnTransitionInBegin_Postfix(TabletLobbyOptionsScreen __instance) {
            if (inviteGroup) {
                urlHintText.text = "Viewers can see the map and place objects in your game in realtime using this URL.";
                freezeGroup.GetChild(0).GetComponent<Text>().fontSize -= 8;
                inviteGroup.anchoredPosition += Vector2.down * 200;
            }
        }

        public static void CopyCrowdControlUrl(PickCursor cursor) {
            if (CrowdControlMod.Instance.room == null) {
                UserMessageManager.Instance.UserMessage("Not connected to the Crowd Control server!", 2f, UserMessageManager.UserMsgPriority.hi, tiedToCurrentScene: true);
                return;
            }

            string url = CrowdControlMod.webserverUrl.Value;
            if (!url.EndsWith("/")) {
                url += "/";
            }
            url += CrowdControlMod.Instance.room;
            QuickSaver.CopyStringToClipboard(url);
            UserMessageManager.Instance.UserMessage("Copied Crowd Control URL to clipboard", 2f, UserMessageManager.UserMsgPriority.lo, tiedToCurrentScene: true);
        }

        public static void ToggleCrowdControlUrl(PickCursor cursor) {
            if (crowdControlUrlShown) {
                // Hide
                crowdControlUrlText.text = "****";
                crowdControlUrlText.fontSize = 100;
                urlRectTransform.anchorMin = urlOriginalAnchorMin;
                urlRectTransform.anchorMax = urlOriginalAnchorMax;
                AkSoundEngine.PostEvent("UI_UPad_Online_Lobby_Code_Hide", cursor.gameObject);
            } else {
                // Show
                string msg;
                if (CrowdControlMod.Instance.room != null) {
                    msg = CrowdControlMod.webserverUrl.Value;
                    if (!msg.EndsWith("/")) {
                        msg += "/";
                    }
                    msg += CrowdControlMod.Instance.room;
                } else {
                    msg = "Not currently connected...";
                }
                crowdControlUrlText.text = msg;
                crowdControlUrlText.fontSize = 42;
                urlRectTransform.anchorMin += Vector2.left * 0.3f;
                urlRectTransform.anchorMax += Vector2.right * 0.2f;
                AkSoundEngine.PostEvent("UI_UPad_Online_Lobby_Code_Show", cursor.gameObject);
            }

            crowdControlUrlShown = !crowdControlUrlShown;
        }
    }
}
