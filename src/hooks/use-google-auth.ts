import { useMutation } from "@tanstack/react-query";
import { authService } from "@/src/services/auth.service";

export const useGoogleAuth = () => {
  return useMutation({
    mutationFn: () => authService.signInWithGoogle(),
  });
};
