using UnityEngine;

namespace Dakota.Avatar
{
    /// <summary>
    /// Minimal bridge between the Unity animator and the web avatar controller.
    /// Exposes PlayLoop / PlayOneShot so the WebGL page can drive animations via SendMessage.
    /// </summary>
    public class AvatarControllerRoot : MonoBehaviour
    {
        [Header("Animator")]
        [SerializeField] private Animator animator;

        [Header("Crossfade Settings")]
        [SerializeField, Tooltip("Duration in seconds for loop transitions.")]
        private float crossfadeDuration = 0.25f;

        private static readonly int SittingTalkingHash = Animator.StringToHash("Sitting_Talking");
        private string currentLoopName = "Sitting_Talking";

        private void Awake()
        {
            if (animator == null)
            {
                animator = GetComponentInChildren<Animator>();
                if (animator == null)
                {
                    Debug.LogError("AvatarControllerRoot could not find an Animator. Please assign one in the inspector.", this);
                }
            }
        }

        /// <summary>
        /// Play (or crossfade to) a looping animation state. Called from JS via SendMessage.
        /// </summary>
        public void PlayLoop(string stateName)
        {
            if (string.IsNullOrEmpty(stateName) || animator == null)
            {
                return;
            }

            currentLoopName = stateName;
            CrossFadeToState(stateName);
        }

        /// <summary>
        /// Play a one-shot animation from the beginning. Used for victory / clap animations.
        /// </summary>
        public void PlayOneShot(string stateName)
        {
            if (string.IsNullOrEmpty(stateName) || animator == null)
            {
                return;
            }

            animator.Play(stateName, 0, 0f);
        }

        /// <summary>
        /// Optional helper for JS to re-assert whatever loop was last requested.
        /// </summary>
        public void ReapplyLoop()
        {
            if (animator == null || string.IsNullOrEmpty(currentLoopName))
            {
                return;
            }

            CrossFadeToState(currentLoopName);
        }

        /// <summary>
        /// Lets designers quickly return to Sitting_Talking, our ambient default.
        /// </summary>
        public void ResetToDefault()
        {
            currentLoopName = "Sitting_Talking";
            CrossFadeToState(SittingTalkingHash);
        }

        private void CrossFadeToState(string stateName)
        {
            if (animator == null)
            {
                return;
            }

            animator.CrossFadeInFixedTime(stateName, crossfadeDuration, 0);
        }

        private void CrossFadeToState(int stateHash)
        {
            if (animator == null)
            {
                return;
            }

            animator.CrossFadeInFixedTime(stateHash, crossfadeDuration, 0);
        }
    }
}
