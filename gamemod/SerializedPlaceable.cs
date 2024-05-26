using System;
using UnityEngine;

namespace UltimateCrowdControlHorse {
    [Serializable]
    public class SerializedPlaceable {

        public Vector3 position;
        public Quaternion rotation;
        public Vector3 localScale;
        public int id;

        public static explicit operator SerializedPlaceable(Placeable placeable) {
            return new SerializedPlaceable() {
                position = placeable.transform.position,
                rotation = placeable.transform.rotation,
                localScale = placeable.transform.localScale,
                id = placeable.ID,
            };
        }
    }
}
