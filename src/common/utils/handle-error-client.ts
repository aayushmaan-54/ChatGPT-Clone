import toast from "react-hot-toast";
import devLogger from "./dev-logger";



export default function handleErrorClient(
  error: unknown,
  showToast: boolean = true
): string {
  if (error instanceof Error) {
    devLogger.error("An error occurred:", error.message);
    if (showToast) toast.error(error.message);
    return error.message;
  }

  if (typeof error === 'string') {
    devLogger.error("An error occurred:", error);
    if (showToast) toast.error(error);
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    devLogger.error("An error occurred:", message);
    if (showToast) toast.error(message);
    return message;
  }

  devLogger.error("An unknown error occurred:", error);
  if (showToast) toast.error("An unknown error occurred");
  return "An unknown error occurred";
}
