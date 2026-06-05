#include <limits.h>
#include <mach-o/dyld.h>
#include <spawn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

extern char **environ;

static int run_command(const char *path, char *const argv[]) {
  pid_t pid;
  int result = posix_spawn(&pid, path, NULL, NULL, argv, environ);
  if (result != 0) return result;

  int status = 0;
  waitpid(pid, &status, 0);
  return status;
}

static int open_path(const char *app_name, const char *path) {
  char *const argv_with_app[] = {
    "/usr/bin/open",
    "-a",
    (char *)app_name,
    (char *)path,
    NULL
  };
  char *const argv_plain[] = {
    "/usr/bin/open",
    (char *)path,
    NULL
  };

  char *const *argv = app_name ? argv_with_app : argv_plain;
  return run_command("/usr/bin/open", argv);
}

static int open_app(const char *path) {
  char *const argv[] = {
    "/usr/bin/open",
    (char *)path,
    NULL
  };
  return run_command("/usr/bin/open", argv);
}

static int install_into_applications(const char *source_app) {
  const char *destination = "/Applications/Minecraft Codex.app";

  if (strcmp(source_app, destination) == 0) return 0;

  char *const rm_argv[] = {
    "/bin/rm",
    "-rf",
    (char *)destination,
    NULL
  };
  run_command("/bin/rm", rm_argv);

  char *const cp_argv[] = {
    "/bin/cp",
    "-R",
    (char *)source_app,
    (char *)destination,
    NULL
  };
  if (run_command("/bin/cp", cp_argv) != 0) return 1;

  char *const chmod_argv[] = {
    "/bin/chmod",
    "+x",
    "/Applications/Minecraft Codex.app/Contents/MacOS/MinecraftCodex",
    NULL
  };
  run_command("/bin/chmod", chmod_argv);

  char *const xattr_quarantine_argv[] = {
    "/usr/bin/xattr",
    "-dr",
    "com.apple.quarantine",
    (char *)destination,
    NULL
  };
  run_command("/usr/bin/xattr", xattr_quarantine_argv);

  char *const xattr_clear_argv[] = {
    "/usr/bin/xattr",
    "-cr",
    (char *)destination,
    NULL
  };
  run_command("/usr/bin/xattr", xattr_clear_argv);

  char *const codesign_argv[] = {
    "/usr/bin/codesign",
    "--force",
    "--deep",
    "--sign",
    "-",
    (char *)destination,
    NULL
  };
  run_command("/usr/bin/codesign", codesign_argv);

  open_app(destination);
  return 0;
}

int main(void) {
  char executable[PATH_MAX];
  uint32_t size = sizeof(executable);
  if (_NSGetExecutablePath(executable, &size) != 0) return 1;

  char *macos = strstr(executable, "/Contents/MacOS/");
  if (!macos) return 1;
  *macos = '\0';

  if (install_into_applications(executable) == 0 &&
      strcmp(executable, "/Applications/Minecraft Codex.app") != 0) {
    return 0;
  }

  char game[PATH_MAX];
  snprintf(game, sizeof(game), "%s/Contents/Resources/index.html", executable);

  if (access("/Applications/Google Chrome.app", F_OK) == 0) {
    int result = open_path("Google Chrome", game);
    if (result == 0) return 0;
  }

  return open_path(NULL, game);
}
