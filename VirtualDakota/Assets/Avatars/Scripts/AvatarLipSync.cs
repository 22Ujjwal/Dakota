using UnityEngine;

namespace VirtualDakota.Avatars
{
    /// <summary>
    /// Deprecated placeholder kept for backwards-compatibility. Lip sync is no longer driven at runtime.
    /// </summary>
    [DisallowMultipleComponent]
    [AddComponentMenu("")]
    [System.Obsolete("AvatarLipSync has been retired. Remove this component from your prefabs.")]
    public class AvatarLipSync : MonoBehaviour
    {
        private void Awake()
        {
            Debug.LogWarning("AvatarLipSync is deprecated and does nothing. Remove it from the avatar hierarchy.", this);
            enabled = false;
        }
    }
}
