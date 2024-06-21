using System;
using System.Collections.Generic;
using SocketIOClient.Transport;
using Newtonsoft.Json.Linq;

namespace SocketIOClient.Messages {
    public class OpenedMessage : IMessage
    {
        public MessageType Type => MessageType.Opened;

        public string Sid { get; set; }

        public string Namespace { get; set; }

        public List<string> Upgrades { get; private set; }

        public int PingInterval { get; private set; }

        public int PingTimeout { get; private set; }

        public List<byte[]> OutgoingBytes { get; set; }

        public List<byte[]> IncomingBytes { get; set; }

        public int BinaryCount { get; }

        public int Eio { get; set; }

        public TransportProtocol Protocol { get; set; }

        private int GetInt32FromJsonElement(JToken element, string msg, string name)
        {
            var p = element.SelectToken(name);
            int val;
            switch (p.Type)
            {
                case JTokenType.String:
                    val = int.Parse(p.Value<string>());
                    break;
                case JTokenType.Integer:
                    val = p.Value<int>();
                    break;
                default:
                    throw new ArgumentException($"Invalid message: '{msg}'");
            }
            return val;
        }

        public void Read(string msg)
        {
            var doc = JObject.Parse(msg);
            var root = doc.Root;
            Sid = root.SelectToken("sid").Value<string>();

            PingInterval = GetInt32FromJsonElement(root, msg, "pingInterval");
            PingTimeout = GetInt32FromJsonElement(root, msg, "pingTimeout");

            Upgrades = new List<string>();
            var upgrades = root.SelectToken("upgrades").Values();
            foreach (var item in upgrades)
            {
                Upgrades.Add(item.Value<string>());
            }
        }

        public string Write()
        {
            //var builder = new StringBuilder();
            //builder.Append("40");
            //if (!string.IsNullOrEmpty(Namespace))
            //{
            //    builder.Append(Namespace).Append(',');
            //}
            //return builder.ToString();
            throw new NotImplementedException();
        }
    }
}
