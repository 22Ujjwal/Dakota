#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

namespace VirtualDakota.Avatars.Editor
{
    /// <summary>
    /// Utility that builds an AnimatorController for the reactive avatar from an AvatarAnimationProfile.
    /// Select the profile asset in the Project window and run the menu item: Tools ▸ VirtualDakota ▸ Build Avatar Animator.
    /// </summary>
    internal static class AvatarAnimatorBuilder
    {
        private const string MenuPath = "Tools/VirtualDakota/Build Avatar Animator";
        private const string ControllersFolder = "Assets/Avatars/Controllers";

    private const string ParamIsSpeaking = "isSpeaking";
    private const string ParamIsTyping = "isTyping";
    private const string ParamDoClap = "doClap";
    private const string ParamDoVictory = "doVictory";
    private const string ParamDoBigVictory = "doBigVictory";

        [MenuItem(MenuPath, priority = 10)]
        private static void BuildAnimator()
        {
            if (!(Selection.activeObject is AvatarAnimationProfile profile))
            {
                EditorUtility.DisplayDialog("Avatar Animator", "Select an AvatarAnimationProfile in the Project window before running this command.", "Ok");
                return;
            }

            if (!profile.HasRequiredClips)
            {
                EditorUtility.DisplayDialog("Avatar Animator", "Assign all required clips (idle, speaking, typing, sitToType, typeToSit, clap, victory, bigVictory) in the AvatarAnimationProfile before building the controller.", "Ok");
                Selection.activeObject = profile;
                return;
            }

            if (!Directory.Exists(ControllersFolder))
            {
                Directory.CreateDirectory(ControllersFolder);
                AssetDatabase.Refresh();
            }

            var controllerPath = AssetDatabase.GenerateUniqueAssetPath(Path.Combine(ControllersFolder, profile.name + "_Animator.controller"));
            var controller = AnimatorController.CreateAnimatorControllerAtPath(controllerPath);

            // Add parameters
            controller.AddParameter(ParamIsSpeaking, AnimatorControllerParameterType.Bool);
            controller.AddParameter(ParamIsTyping, AnimatorControllerParameterType.Bool);
            controller.AddParameter(ParamDoClap, AnimatorControllerParameterType.Trigger);
            controller.AddParameter(ParamDoVictory, AnimatorControllerParameterType.Trigger);
            controller.AddParameter(ParamDoBigVictory, AnimatorControllerParameterType.Trigger);

            // Configure base layer states
            var stateMachine = controller.layers[0].stateMachine;

            var idleState = stateMachine.AddState("Idle");
            idleState.motion = profile.idle;
            idleState.writeDefaultValues = true;
            stateMachine.defaultState = idleState;

            var speakingState = stateMachine.AddState("Speaking");
            speakingState.motion = profile.speaking;
            speakingState.writeDefaultValues = true;

            var typingIntroState = stateMachine.AddState("Typing_Intro");
            typingIntroState.motion = profile.sitToType;
            typingIntroState.writeDefaultValues = true;

            var typingLoopState = stateMachine.AddState("Typing_Loop");
            typingLoopState.motion = profile.typing;
            typingLoopState.writeDefaultValues = true;

            var typingOutroState = stateMachine.AddState("Typing_Outro");
            typingOutroState.motion = profile.typeToSit;
            typingOutroState.writeDefaultValues = true;

            var clapState = stateMachine.AddState("Clap");
            clapState.motion = profile.clap;
            clapState.writeDefaultValues = true;

            var victoryState = stateMachine.AddState("Victory");
            victoryState.motion = profile.victory;
            victoryState.writeDefaultValues = true;

            var bigVictoryState = stateMachine.AddState("BigVictory");
            bigVictoryState.motion = profile.bigVictory;
            bigVictoryState.writeDefaultValues = true;

            AnimatorStateTransition AddTransition(AnimatorState from, AnimatorState to, float duration = 0.1f)
            {
                var transition = from.AddTransition(to);
                transition.hasExitTime = false;
                transition.duration = duration;
                return transition;
            }

            // Idle to speaking when narration begins
            var idleToSpeaking = AddTransition(idleState, speakingState);
            idleToSpeaking.AddCondition(AnimatorConditionMode.If, 0f, ParamIsSpeaking);

            // Speaking to idle when narration stops and typing is not requested
            var speakingToIdle = AddTransition(speakingState, idleState);
            speakingToIdle.AddCondition(AnimatorConditionMode.IfNot, 0f, ParamIsSpeaking);
            speakingToIdle.AddCondition(AnimatorConditionMode.IfNot, 0f, ParamIsTyping);

            // Speaking to typing when narration pauses but typing begins
            var speakingToTypingIntro = AddTransition(speakingState, typingIntroState);
            speakingToTypingIntro.AddCondition(AnimatorConditionMode.IfNot, 0f, ParamIsSpeaking);
            speakingToTypingIntro.AddCondition(AnimatorConditionMode.If, 0f, ParamIsTyping);

            // Idle to typing intro
            var idleToTypingIntro = AddTransition(idleState, typingIntroState);
            idleToTypingIntro.AddCondition(AnimatorConditionMode.If, 0f, ParamIsTyping);

            // Typing intro auto-progress and cancellation
            var introToLoop = typingIntroState.AddTransition(typingLoopState);
            introToLoop.hasExitTime = true;
            introToLoop.exitTime = 0.95f;
            introToLoop.duration = 0.05f;

            var introToIdle = AddTransition(typingIntroState, idleState);
            introToIdle.AddCondition(AnimatorConditionMode.IfNot, 0f, ParamIsTyping);

            // Typing loop exit or interruption
            var loopToOutro = AddTransition(typingLoopState, typingOutroState);
            loopToOutro.AddCondition(AnimatorConditionMode.IfNot, 0f, ParamIsTyping);

            var loopToSpeaking = AddTransition(typingLoopState, speakingState);
            loopToSpeaking.AddCondition(AnimatorConditionMode.If, 0f, ParamIsSpeaking);

            // Typing outro returns to idle or re-enters typing when AI resumes
            var outroToIdle = typingOutroState.AddTransition(idleState);
            outroToIdle.hasExitTime = true;
            outroToIdle.exitTime = 0.95f;
            outroToIdle.duration = 0.05f;

            var outroToIntro = AddTransition(typingOutroState, typingIntroState);
            outroToIntro.AddCondition(AnimatorConditionMode.If, 0f, ParamIsTyping);

            // Allow narration to pre-empt intro/outro
            var introToSpeaking = AddTransition(typingIntroState, speakingState);
            introToSpeaking.AddCondition(AnimatorConditionMode.If, 0f, ParamIsSpeaking);

            var outroToSpeaking = AddTransition(typingOutroState, speakingState);
            outroToSpeaking.AddCondition(AnimatorConditionMode.If, 0f, ParamIsSpeaking);

            // Celebration triggers from any state
            AnimatorStateTransition CreateTriggerTransition(AnimatorState targetState, string parameter)
            {
                var transition = stateMachine.AddAnyStateTransition(targetState);
                transition.hasExitTime = false;
                transition.duration = 0.05f;
                transition.canTransitionToSelf = false;
                transition.AddCondition(AnimatorConditionMode.If, 0f, parameter);
                return transition;
            }

            CreateTriggerTransition(clapState, ParamDoClap);
            CreateTriggerTransition(victoryState, ParamDoVictory);
            CreateTriggerTransition(bigVictoryState, ParamDoBigVictory);

            AnimatorStateTransition CreateCelebrationExit(AnimatorState from)
            {
                var exitTransition = from.AddTransition(idleState);
                exitTransition.hasExitTime = true;
                exitTransition.exitTime = 0.95f;
                exitTransition.duration = 0.1f;
                return exitTransition;
            }

            CreateCelebrationExit(clapState);
            CreateCelebrationExit(victoryState);
            CreateCelebrationExit(bigVictoryState);

            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log($"Avatar animator created at {controllerPath}. Assign it to the avatar's Animator component.");
        }

        [MenuItem(MenuPath, validate = true)]
        private static bool ValidateBuildAnimator()
        {
            return Selection.activeObject is AvatarAnimationProfile;
        }
    }
}
#endif
