using System;
using UnityEngine;

namespace UltimateCrowdControlHorse {
    [Serializable]
    public class SerializedPlaceable {

        public System.Numerics.Vector2 position;
        public int rotation;
        public System.Numerics.Vector2 localScale;
        public int id;
        public string name;

        public static explicit operator SerializedPlaceable(Placeable placeable) {
            var transform = placeable.transform;

            return new SerializedPlaceable() {
                position = new System.Numerics.Vector2(transform.position.x, transform.position.y),
                rotation = Mathf.RoundToInt(transform.rotation.eulerAngles.z),
                localScale = new System.Numerics.Vector2(transform.localScale.x, transform.localScale.y),
                id = placeable.ID,
                name = placeable.Name,
            };
        }
    }
}
